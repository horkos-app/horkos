use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Config, Issuer},
};

#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct GrantIssuer<'info> {
    #[account(mut)]
    pub master: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = master @ ErrorCode::Unauthorized)]
    pub config: Account<'info, Config>,
    #[account(
        init_if_needed,
        payer = master,
        space = 8 + Issuer::INIT_SPACE,
        seeds = [ISSUER_SEED, wallet.as_ref()],
        bump
    )]
    pub issuer: Account<'info, Issuer>,
    pub system_program: Program<'info, System>,
}

pub fn handle_grant_issuer(ctx: Context<GrantIssuer>, wallet: Pubkey) -> Result<()> {
    let issuer = &mut ctx.accounts.issuer;
    issuer.authority = wallet;
    issuer.active = true;
    issuer.bump = ctx.bumps.issuer;
    Ok(())
}
