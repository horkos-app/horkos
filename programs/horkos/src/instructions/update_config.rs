use anchor_lang::prelude::*;

use crate::{constants::*, error::ErrorCode, state::Config};

// Master changes the issuer registration price. fee_bps is fixed after init.
#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    // Not `mut`: only signs, pays nothing.
    pub master: Signer<'info>,
    // `has_one = master` => require config.master == master.key(); `@` picks the error.
    // `bump = config.bump` verifies the PDA with the stored bump (no bump search).
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump, has_one = master @ ErrorCode::Unauthorized)]
    pub config: Account<'info, Config>,
}

pub fn handle_update_config(ctx: Context<UpdateConfig>, issuer_fee_lamports: u64) -> Result<()> {
    ctx.accounts.config.issuer_fee_lamports = issuer_fee_lamports;
    Ok(())
}
