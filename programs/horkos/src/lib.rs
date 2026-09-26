pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("4Y55LTgKQPYsy9pTqXYUupeRrogBDG83LwJTmWEkggfh");

#[program]
pub mod horkos {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>) -> Result<()> {
        crate::instructions::init_config::handle_init_config(ctx)
    }

    pub fn grant_issuer(ctx: Context<GrantIssuer>, wallet: Pubkey) -> Result<()> {
        crate::instructions::grant_issuer::handle_grant_issuer(ctx, wallet)
    }

    pub fn update_issuer(ctx: Context<UpdateIssuer>, active: bool) -> Result<()> {
        crate::instructions::update_issuer::handle_update_issuer(ctx, active)
    }

    pub fn create_license_type(
        ctx: Context<CreateLicenseType>,
        id: u64,
        price_lamports: u64,
        duration_secs: i64,
        resign_window_secs: i64,
    ) -> Result<()> {
        crate::instructions::create_license_type::handle_create_license_type(
            ctx,
            id,
            price_lamports,
            duration_secs,
            resign_window_secs,
        )
    }

    pub fn update_license_type(
        ctx: Context<UpdateLicenseType>,
        price_lamports: u64,
        duration_secs: i64,
        resign_window_secs: i64,
        active: bool
    ) -> Result<()> {
        crate::instructions::update_license_type::handle_update_license_type(
            ctx,
            price_lamports,
            duration_secs,
            resign_window_secs,
            active
        )
    }

    pub fn purchase(ctx: Context<Purchase>) -> Result<()> {
        crate::instructions::purchase::handle_purchase(ctx)
    }

    pub fn renew(ctx: Context<Renew>) -> Result<()> {
        crate::instructions::renew::handle_renew(ctx)
    }

    pub fn resign(ctx: Context<Resign>) -> Result<()> {
        crate::instructions::resign::handle_resign(ctx)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        crate::instructions::claim::handle_claim(ctx)
    }
}
