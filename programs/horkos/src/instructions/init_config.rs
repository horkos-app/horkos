use anchor_lang::prelude::*;

use crate::{constants::*, state::Config};

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub master: Signer<'info>,
    #[account(
        init,
        payer = master,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

pub fn handle_init_config(ctx: Context<InitConfig>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.master = ctx.accounts.master.key();
    config.fee_bps = FEE_BPS;
    config.issuer_fee_lamports = ISSUER_FEE_LAMPORTS;
    config.bump = ctx.bumps.config;
    Ok(())
}
