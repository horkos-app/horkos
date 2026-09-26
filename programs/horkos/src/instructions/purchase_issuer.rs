use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Config, Issuer},
};

#[derive(Accounts)]
pub struct PurchaseIssuer<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub master: SystemAccount<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = master @ ErrorCode::Unauthorized)]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = authority,
        space = 8 + Issuer::INIT_SPACE,
        seeds = [ISSUER_SEED, authority.key().as_ref()],
        bump
    )]
    pub issuer: Account<'info, Issuer>,
    pub system_program: Program<'info, System>,
}

pub fn handle_purchase_issuer(ctx: Context<PurchaseIssuer>, name: String) -> Result<()> {
    require!(name.len() <= MAX_NAME_LEN as usize, ErrorCode::TextTooLong);
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.key(),
            Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.master.to_account_info(),
            },
        ),
        ctx.accounts.config.issuer_fee_lamports,
    )?;

    let issuer = &mut ctx.accounts.issuer;
    issuer.authority = ctx.accounts.authority.key();
    issuer.active = true;
    issuer.bump = ctx.bumps.issuer;
    issuer.name = name;
    Ok(())
}
