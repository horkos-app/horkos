use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::*,
    error::ErrorCode,
    instructions::claim::pay_out,
    state::{Config, Issuer, License, LicenseType},
};

// Buyer extends an existing License by one more `duration_secs`.
// Since `paid` holds only one payment, the previous escrow is paid out to the issuer
// first, then the new payment becomes the escrow.
#[derive(Accounts)]
pub struct Renew<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    // Needed for fee_bps and to validate `master` (fee receiver of the auto payout).
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = master)]
    pub config: Account<'info, Config>,
    // UncheckedAccount = Anchor does no type/owner checks. Safe here because config.has_one
    // guarantees the address. Anchor requires the `/// CHECK:` doc comment to compile.
    /// CHECK: address enforced by config.has_one
    #[account(mut)]
    pub master: UncheckedAccount<'info>,
    #[account(
        seeds = [ISSUER_SEED, issuer.authority.as_ref()],
        bump = issuer.bump,
        has_one = authority,
        constraint = issuer.active @ ErrorCode::IssuerInactive
    )]
    pub issuer: Account<'info, Issuer>,
    // Issuer's wallet, receives the net payout. Not a signer: the buyer renews
    // without the issuer's involvement.
    /// CHECK: address enforced by issuer.has_one
    #[account(mut)]
    pub authority: UncheckedAccount<'info>,
    #[account(
        seeds = [LICENSE_TYPE_SEED, issuer.key().as_ref(), &license_type.id.to_le_bytes()],
        bump = license_type.bump,
        has_one = issuer,
        constraint = license_type.active @ ErrorCode::LicenseTypeInactive
    )]
    pub license_type: Account<'info, LicenseType>,
    // Seeds include owner.key() AND has_one = owner: only the buyer can renew their license.
    #[account(
        mut,
        seeds = [LICENSE_SEED, license_type.key().as_ref(), owner.key().as_ref()],
        bump = license.bump,
        has_one = owner @ ErrorCode::Unauthorized,
        has_one = license_type
    )]
    pub license: Account<'info, License>,
    pub system_program: Program<'info, System>,
}

pub fn handle_renew(ctx: Context<Renew>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    // Can't renew while the previous payment is still refundable: paying it out
    // below would take away the buyer's refund right.
    require!(now >= ctx.accounts.license.resign_deadline, ErrorCode::ResignWindowOpen);

    // New payment into the escrow (License PDA).
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.key(),
            Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.license.to_account_info(),
            },
        ),
        ctx.accounts.license_type.price_lamports,
    )?;

    // Settle the previous payment if the issuer hasn't claimed it yet
    // (paid == 0 if already claimed or refunded). Uses the old `paid` value,
    // so the new payment just transferred stays in escrow.
    if ctx.accounts.license.paid > 0 {
        pay_out(
            &mut ctx.accounts.license,
            &ctx.accounts.authority.to_account_info(),
            &ctx.accounts.master.to_account_info(),
            ctx.accounts.config.fee_bps,
        )?;
    }

    let license_type = &ctx.accounts.license_type;

    let license = &mut ctx.accounts.license;
    // Still valid => extend from current expiry (no lost time). Expired => start from now.
    let start = license.expires_at.max(now);
    license.paid = license_type.price_lamports;
    // A buyer who already resigned once gets no new refund window (deadline = now => closed).
    license.resign_deadline = if license.resigned {
        now
    } else {
        now.checked_add(license_type.resign_window_secs)
            .ok_or(ErrorCode::Overflow)?
    };
    // Remember where this renewal started so a resign can roll it back exactly.
    license.prev_expires_at = start;
    license.expires_at = start
        .checked_add(license_type.duration_secs)
        .ok_or(ErrorCode::Overflow)?;
    Ok(())
}
