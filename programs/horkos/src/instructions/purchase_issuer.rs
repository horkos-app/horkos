use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Config, Issuer},
};

// Any wallet becomes an issuer by paying `config.issuer_fee_lamports` to master.
#[derive(Accounts)]
pub struct PurchaseIssuer<'info> {
    // Pays the fee and the Issuer account rent.
    #[account(mut)]
    pub authority: Signer<'info>,
    // Receives the fee. SystemAccount = must be a plain wallet (owned by the System Program).
    // `has_one = master` on config pins it to the real master so the caller can't redirect the fee.
    #[account(mut)]
    pub master: SystemAccount<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = master @ ErrorCode::Unauthorized)]
    pub config: Account<'info, Config>,
    // Seeds include the signer's key => one Issuer per wallet; re-registering fails on `init`.
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
    // Must check: the account was sized for MAX_NAME_LEN, a longer name would fail to serialize.
    require!(name.len() <= MAX_NAME_LEN as usize, ErrorCode::TextTooLong);
    // CPI into the System Program. Needed (instead of add/sub_lamports) because `authority`
    // is a wallet owned by the System Program; only its owner can debit it.
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
