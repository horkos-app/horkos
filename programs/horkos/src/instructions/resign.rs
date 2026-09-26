use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{License, LicenseType},
};

#[derive(Accounts)]
pub struct Resign<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        seeds = [LICENSE_TYPE_SEED, license_type.issuer.as_ref(), &license_type.id.to_le_bytes()],
        bump = license_type.bump
    )]
    pub license_type: Account<'info, LicenseType>,
    #[account(
        mut,
        seeds = [LICENSE_SEED, license_type.key().as_ref(), owner.key().as_ref()],
        bump = license.bump,
        has_one = owner @ ErrorCode::Unauthorized,
        has_one = license_type
    )]
    pub license: Account<'info, License>,
}

pub fn handle_resign(ctx: Context<Resign>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let owner = ctx.accounts.owner.to_account_info();
    let license = &mut ctx.accounts.license;
    require!(
        !license.resigned && now < license.resign_deadline,
        ErrorCode::ResignWindowClosed
    );
    require!(license.paid > 0, ErrorCode::NothingToClaim);

    let refund = license.paid;
    license.sub_lamports(refund)?;
    owner.add_lamports(refund)?;
    license.paid = 0;
    license.resigned = true;
    license.expires_at = license.prev_expires_at;
    license.resign_deadline = now;
    Ok(())
}
