use anchor_lang::prelude::*;

use crate::{constants::*, error::ErrorCode, state::Config};

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub master: Signer<'info>,
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump, has_one = master @ ErrorCode::Unauthorized)]
    pub config: Account<'info, Config>,
}

pub fn handle_update_config(ctx: Context<UpdateConfig>, issuer_fee_lamports: u64) -> Result<()> {
    ctx.accounts.config.issuer_fee_lamports = issuer_fee_lamports;
    Ok(())
}
