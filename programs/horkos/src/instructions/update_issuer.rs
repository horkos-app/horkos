use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Config, Issuer},
};

// Master activates/deactivates an issuer. Inactive issuers can't create/edit license
// types and their licenses can't be purchased or renewed. Claims and refunds still work.
#[derive(Accounts)]
pub struct UpdateIssuer<'info> {
    pub master: Signer<'info>,
    // Loaded only to prove the signer is master.
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = master @ ErrorCode::Unauthorized)]
    pub config: Account<'info, Config>,
    // Seeds use `issuer.authority` read from the account itself. That's fine: the seeds
    // check still proves this is a genuine Issuer PDA of this program.
    #[account(mut, seeds = [ISSUER_SEED, issuer.authority.as_ref()], bump = issuer.bump)]
    pub issuer: Account<'info, Issuer>,
}

pub fn handle_update_issuer(ctx: Context<UpdateIssuer>, active: bool) -> Result<()> {
    ctx.accounts.issuer.active = active;
    Ok(())
}
