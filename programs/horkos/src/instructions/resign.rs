use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{License, LicenseType},
};

// Buyer cancels the last payment within the resign window and gets it back in full (no fee).
// Intentionally doesn't check issuer/license_type `active`: refunds must work even
// if the issuer got banned or the product was disabled.
#[derive(Accounts)]
pub struct Resign<'info> {
    // `mut`: receives the refund.
    #[account(mut)]
    pub owner: Signer<'info>,
    // Only needed to validate the License PDA seeds; Issuer isn't loaded at all.
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
    // Taken before `license` borrows ctx.accounts mutably (borrow checker).
    let owner = ctx.accounts.owner.to_account_info();
    let license = &mut ctx.accounts.license;
    // One refund per license, and only before the deadline.
    require!(
        !license.resigned && now < license.resign_deadline,
        ErrorCode::ResignWindowClosed
    );
    require!(license.paid > 0, ErrorCode::NothingToClaim);

    let refund = license.paid;
    // Direct lamport move, no CPI: allowed because this program owns the License account
    // (a program may debit accounts it owns; anyone may credit any writable account).
    // Only `paid` is moved, rent stays so the account remains alive.
    license.sub_lamports(refund)?;
    owner.add_lamports(refund)?;
    license.paid = 0;
    license.resigned = true;
    // Undo the time this payment added.
    license.expires_at = license.prev_expires_at;
    // Close the window (also lets `renew` pass its resign_deadline check right away).
    license.resign_deadline = now;
    Ok(())
}
