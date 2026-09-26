use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Issuer, License, LicenseType},
};

#[derive(Accounts)]
pub struct Purchase<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        seeds = [ISSUER_SEED, issuer.authority.as_ref()],
        bump = issuer.bump,
        constraint = issuer.active @ ErrorCode::IssuerInactive
    )]
    pub issuer: Account<'info, Issuer>,
    #[account(
        seeds = [LICENSE_TYPE_SEED, issuer.key().as_ref(), &license_type.id.to_le_bytes()],
        bump = license_type.bump,
        has_one = issuer,
        constraint = license_type.active @ ErrorCode::LicenseTypeInactive
    )]
    pub license_type: Account<'info, LicenseType>,
    #[account(
        init,
        payer = owner,
        space = 8 + License::INIT_SPACE,
        seeds = [LICENSE_SEED, license_type.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub license: Account<'info, License>,
    pub system_program: Program<'info, System>,
}

pub fn handle_purchase(ctx: Context<Purchase>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let license_type = &ctx.accounts.license_type;

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.key(),
            Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.license.to_account_info(),
            },
        ),
        license_type.price_lamports,
    )?;

    let license = &mut ctx.accounts.license;
    license.license_type = license_type.key();
    license.owner = ctx.accounts.owner.key();
    license.paid = license_type.price_lamports;
    license.resign_deadline = now
        .checked_add(license_type.resign_window_secs)
        .ok_or(ErrorCode::Overflow)?;
    license.prev_expires_at = now;
    license.expires_at = now
        .checked_add(license_type.duration_secs)
        .ok_or(ErrorCode::Overflow)?;
    license.bump = ctx.bumps.license;
    Ok(())
}
