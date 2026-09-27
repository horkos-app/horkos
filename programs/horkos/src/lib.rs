// Horkos: on-chain software/subscription licensing with a refund ("resign") window.
//
// Actors:
//   master  - program deployer (upgrade authority). Owns the global Config, earns a fee on every payout.
//   issuer  - a seller. Pays `issuer_fee_lamports` once to master to register, then defines LicenseTypes.
//   owner   - a buyer. Buys a License of some LicenseType, can renew it or resign (refund) it.
//
// Money flow:
//   purchase/renew: owner --price--> License PDA (escrow, `license.paid`)
//   resign:         License PDA --paid--> owner              (only while resign window is open)
//   claim/renew:    License PDA --paid - fee--> issuer authority, --fee--> master
//                                                            (only after resign window closed)
//
// Account tree (all PDAs of this program, see constants.rs for seeds):
//   Config       ["config"]
//   Issuer       ["issuer", authority]
//   LicenseType  ["type", issuer_pda, id_le_bytes]
//   License      ["license", license_type_pda, owner]
//
// Anchor layout convention used everywhere:
//   instructions/<name>.rs holds `#[derive(Accounts)] struct <Name>` (account validation)
//   and `handle_<name>` (business logic). This file only forwards to those handlers.

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

// Program address. Must match the keypair in target/deploy and Anchor.toml.
declare_id!("AsGTHWf1Cix3TuD2uk4xEewv4MetpSR1W6coCBA2TG6K");

// `#[program]` turns every `pub fn` here into an instruction. Anchor derives each
// instruction's 8-byte discriminator from sha256("global:<fn_name>") and generates
// the IDL/client from these signatures. Arguments after `ctx` are Borsh-deserialized
// from instruction data in this exact order.
#[program]
pub mod horkos {
    use super::*;

    // Master only, once. Creates the global Config.
    pub fn init_config(ctx: Context<InitConfig>) -> Result<()> {
        crate::instructions::init_config::handle_init_config(ctx)
    }

    // Master only. Changes the price of becoming an issuer.
    pub fn update_config(ctx: Context<UpdateConfig>, issuer_fee_lamports: u64) -> Result<()> {
        crate::instructions::update_config::handle_update_config(ctx, issuer_fee_lamports)
    }

    // Anyone. Pays master the issuer fee and registers the signer as an Issuer.
    pub fn purchase_issuer(ctx: Context<PurchaseIssuer>, name: String) -> Result<()> {
        crate::instructions::purchase_issuer::handle_purchase_issuer(ctx, name)
    }

    // Master only. Enables/disables (bans) an issuer.
    pub fn update_issuer(ctx: Context<UpdateIssuer>, active: bool) -> Result<()> {
        crate::instructions::update_issuer::handle_update_issuer(ctx, active)
    }

    // Issuer only. Defines a new product (price, duration, refund window).
    pub fn create_license_type(
        ctx: Context<CreateLicenseType>,
        id: u64,
        price_lamports: u64,
        duration_secs: i64,
        resign_window_secs: i64,
        name: String,
        description: String,
    ) -> Result<()> {
        crate::instructions::create_license_type::handle_create_license_type(
            ctx,
            id,
            price_lamports,
            duration_secs,
            resign_window_secs,
            name,
            description,
        )
    }

    // Issuer only. Edits an existing product. `id` can't change (it's part of the PDA seeds).
    pub fn update_license_type(
        ctx: Context<UpdateLicenseType>,
        price_lamports: u64,
        duration_secs: i64,
        resign_window_secs: i64,
        active: bool,
        name: String,
        description: String,
    ) -> Result<()> {
        crate::instructions::update_license_type::handle_update_license_type(
            ctx,
            price_lamports,
            duration_secs,
            resign_window_secs,
            active,
            name,
            description,
        )
    }

    // Buyer. First-time purchase; creates the License account and escrows the price in it.
    pub fn purchase(ctx: Context<Purchase>) -> Result<()> {
        crate::instructions::purchase::handle_purchase(ctx)
    }

    // Buyer. Extends an existing License; also settles the previous escrow to the issuer.
    pub fn renew(ctx: Context<Renew>) -> Result<()> {
        crate::instructions::renew::handle_renew(ctx)
    }

    // Buyer. Refund of the current escrow while the resign window is open.
    pub fn resign(ctx: Context<Resign>) -> Result<()> {
        crate::instructions::resign::handle_resign(ctx)
    }

    // Issuer. Collects the escrow of a License after its resign window closed.
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        crate::instructions::claim::handle_claim(ctx)
    }
}
