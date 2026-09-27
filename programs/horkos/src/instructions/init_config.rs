use anchor_lang::{prelude::*, solana_program::bpf_loader_upgradeable};

use crate::{constants::*, error::ErrorCode, state::Config};

// Creates the global Config. Only the program's upgrade authority may call it,
// otherwise anyone could front-run the deploy and make themselves master.
#[derive(Accounts)]
pub struct InitConfig<'info> {
    // `mut` because it pays rent for the new account (lamports leave it).
    #[account(mut)]
    pub master: Signer<'info>,
    // `init` = create via System Program CPI, assign to this program, write discriminator.
    // Fixed seed ["config"] makes it a singleton: a second init fails (account exists).
    // `bump` without a value = Anchor finds the canonical bump, exposed as ctx.bumps.config.
    #[account(
        init,
        payer = master,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    // The ProgramData account of an upgradeable program is a PDA of the BPF upgradeable
    // loader with seed = our program id. `seeds::program` switches the PDA derivation to
    // that loader. It stores the upgrade authority, which must equal the signer.
    #[account(
        seeds = [crate::ID.as_ref()],
        bump,
        seeds::program = bpf_loader_upgradeable::ID,
        constraint = program_data.upgrade_authority_address == Some(master.key()) @ ErrorCode::Unauthorized
    )]
    pub program_data: Account<'info, ProgramData>,
    // Required by `init` (account creation is a System Program CPI).
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
