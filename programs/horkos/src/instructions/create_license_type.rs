use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Issuer, LicenseType},
};

// Issuer defines a new product.
#[derive(Accounts)]
// Lets the account constraints below use instruction args. Must list args in the
// same order as the handler, from the first one (you may stop early, can't skip).
#[instruction(id: u64)]
pub struct CreateLicenseType<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    // Seeds from the signer's key => this is the signer's own Issuer.
    // has_one is then redundant but explicit.
    #[account(
        seeds = [ISSUER_SEED, authority.key().as_ref()],
        bump = issuer.bump,
        has_one = authority @ ErrorCode::Unauthorized,
        constraint = issuer.active @ ErrorCode::IssuerInactive
    )]
    pub issuer: Account<'info, Issuer>,
    // `id` is chosen by the issuer (e.g. 0, 1, 2...); reusing an id fails on `init`.
    // Little-endian bytes: clients must encode the id the same way to derive the address.
    #[account(
        init,
        payer = authority,
        space = 8 + LicenseType::INIT_SPACE,
        seeds = [LICENSE_TYPE_SEED, issuer.key().as_ref(), &id.to_le_bytes()],
        bump
    )]
    pub license_type: Account<'info, LicenseType>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_license_type(
    ctx: Context<CreateLicenseType>,
    id: u64,
    price_lamports: u64,
    duration_secs: i64,
    resign_window_secs: i64,
    name: String,
    description: String,
) -> Result<()> {
    validate_license_params(duration_secs, resign_window_secs)?;
    validate_text(&name, &description)?;
    let license_type = &mut ctx.accounts.license_type;
    license_type.issuer = ctx.accounts.issuer.key();
    license_type.id = id;
    license_type.price_lamports = price_lamports;
    license_type.duration_secs = duration_secs;
    license_type.resign_window_secs = resign_window_secs;
    license_type.active = true;
    license_type.bump = ctx.bumps.license_type;
    license_type.name = name;
    license_type.description = description;
    Ok(())
}

// Shared with update_license_type. Refund window can't outlast the license period,
// otherwise a buyer could use the whole period and still get refunded.
pub(crate) fn validate_license_params(duration_secs: i64, resign_window_secs: i64) -> Result<()> {
    require!(
        duration_secs > 0 && resign_window_secs >= 0 && resign_window_secs <= duration_secs,
        ErrorCode::InvalidParams
    );
    Ok(())
}

// Byte lengths must fit the space reserved by `#[max_len]` in state.rs.
pub(crate) fn validate_text(name: &str, description: &str) -> Result<()> {
    require!(
        name.len() <= MAX_NAME_LEN as usize && description.len() <= MAX_DESC_LEN as usize,
        ErrorCode::TextTooLong
    );
    Ok(())
}
