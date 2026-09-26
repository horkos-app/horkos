use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Config, Issuer},
};

#[derive(Accounts)]
pub struct UpdateIssuer<'info> {
    pub master: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = master @ ErrorCode::Unauthorized)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [ISSUER_SEED, issuer.authority.as_ref()], bump = issuer.bump)]
    pub issuer: Account<'info, Issuer>,
}

pub fn handle_update_issuer(ctx: Context<UpdateIssuer>, active: bool) -> Result<()> {
    ctx.accounts.issuer.active = active;
    Ok(())
}
