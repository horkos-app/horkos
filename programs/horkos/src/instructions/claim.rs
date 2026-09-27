use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Config, FeePaid, Issuer, License, LicenseType},
};

// Issuer collects a license's escrow once the buyer can no longer refund it.
// Called per License (one tx instruction per buyer).
#[derive(Accounts)]
pub struct Claim<'info> {
    // Issuer wallet, receives net payout.
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = master)]
    pub config: Account<'info, Config>,
    // Receives the fee. Any address other than config.master fails has_one.
    /// CHECK: address enforced by config.has_one
    #[account(mut)]
    pub master: UncheckedAccount<'info>,
    // Chain of has_one checks: signer -> issuer -> license_type -> license.
    // Together they prove the signer is the seller of this specific license.
    #[account(
        seeds = [ISSUER_SEED, authority.key().as_ref()],
        bump = issuer.bump,
        has_one = authority @ ErrorCode::Unauthorized
    )]
    pub issuer: Account<'info, Issuer>,
    #[account(
        seeds = [LICENSE_TYPE_SEED, issuer.key().as_ref(), &license_type.id.to_le_bytes()],
        bump = license_type.bump,
        has_one = issuer
    )]
    pub license_type: Account<'info, LicenseType>,
    // Owner isn't a signer here, so seeds use the owner stored in the license.
    #[account(
        mut,
        seeds = [LICENSE_SEED, license_type.key().as_ref(), license.owner.as_ref()],
        bump = license.bump,
        has_one = license_type
    )]
    pub license: Account<'info, License>,
}

pub fn handle_claim(ctx: Context<Claim>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    // Mirror of resign's check: exactly one of resign/claim is possible at any moment.
    require!(now >= ctx.accounts.license.resign_deadline, ErrorCode::ResignWindowOpen);
    require!(ctx.accounts.license.paid > 0, ErrorCode::NothingToClaim);

    pay_out(
        &mut ctx.accounts.license,
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.master.to_account_info(),
        ctx.accounts.config.fee_bps,
    )
}

// Releases the whole escrow: fee to master, rest to issuer authority. Shared with renew.
// Caller must check the resign window is closed.
pub(crate) fn pay_out<'info>(
    license: &mut Account<'info, License>,
    authority: &AccountInfo<'info>,
    master: &AccountInfo<'info>,
    fee_bps: u16,
) -> Result<()> {
    let paid = license.paid;
    // Math in u128 so paid * fee_bps can't overflow; integer division rounds the fee down.
    // E.g. paid = 1_000_000, fee_bps = 100 => fee = 10_000 (1%).
    let fee = u64::try_from(u128::from(paid) * u128::from(fee_bps) / 10_000)
        .map_err(|_| ErrorCode::Overflow)?;
    let net = paid.checked_sub(fee).ok_or(ErrorCode::Overflow)?;

    // Same direct lamport move as in resign (program owns License). net + fee == paid,
    // so total lamports are conserved, which the runtime enforces per transaction.
    license.sub_lamports(paid)?;
    authority.add_lamports(net)?;
    master.add_lamports(fee)?;
    license.paid = 0;
    emit!(FeePaid {
        license: license.key(),
        license_type: license.license_type,
        amount: paid,
        fee,
    });
    Ok(())
}
