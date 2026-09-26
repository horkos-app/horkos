use anchor_lang::prelude::*;

use crate::{
    constants::*,
    create_license_type::{validate_license_params, validate_text},
    error::ErrorCode,
    state::{Issuer, LicenseType},
};

#[derive(Accounts)]
pub struct UpdateLicenseType<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [ISSUER_SEED, authority.key().as_ref()],
        bump = issuer.bump,
        has_one = authority @ ErrorCode::Unauthorized,
        constraint = issuer.active @ ErrorCode::IssuerInactive
    )]
    pub issuer: Account<'info, Issuer>,
    #[account(
        mut,
        seeds = [LICENSE_TYPE_SEED, issuer.key().as_ref(), &license_type.id.to_le_bytes()],
        bump = license_type.bump,
        has_one = issuer @ ErrorCode::Unauthorized
    )]
    pub license_type: Account<'info, LicenseType>,
}

pub fn handle_update_license_type(
    ctx: Context<UpdateLicenseType>,
    price_lamports: u64,
    duration_secs: i64,
    resign_window_secs: i64,
    active: bool,
    name: String,
    description: String,
) -> Result<()> {
    validate_license_params(duration_secs, resign_window_secs)?;
    validate_text(&name, &description)?;
    let license_type = &mut ctx.accounts.license_type;
    license_type.price_lamports = price_lamports;
    license_type.duration_secs = duration_secs;
    license_type.resign_window_secs = resign_window_secs;
    license_type.active = active;
    license_type.name = name;
    license_type.description = description;
    Ok(())
}
