use anchor_lang::prelude::*;

use crate::constants::*;

// `#[account]` = Borsh-serialized account data prefixed with an 8-byte discriminator
// (sha256("account:<Name>")[..8]); Anchor checks that discriminator and that the
// account is owned by this program whenever you use `Account<'info, T>`.
// `#[derive(InitSpace)]` computes `T::INIT_SPACE` (data size WITHOUT the discriminator),
// which is why every `init` uses `space = 8 + T::INIT_SPACE`.
// `bump` fields cache the PDA bump so later instructions can pass `bump = x.bump`
// instead of re-searching it (cheaper compute).

// Global singleton, PDA ["config"].
#[account]
#[derive(InitSpace)]
pub struct Config {
    // Admin; receives issuer registration fees and the protocol fee on payouts.
    pub master: Pubkey,
    // Protocol fee on payouts, in basis points (1/10_000).
    pub fee_bps: u16,
    // One-time price paid to master by `purchase_issuer`.
    pub issuer_fee_lamports: u64,
    pub bump: u8,
}

// A seller, PDA ["issuer", authority]. One per wallet.
#[account]
#[derive(InitSpace)]
pub struct Issuer {
    // Wallet that controls this issuer and receives payouts.
    pub authority: Pubkey,
    // Master can set false to block new sales/renewals and edits.
    pub active: bool,
    pub bump: u8,
    // String space = 4-byte length prefix + max_len bytes.
    #[max_len(MAX_NAME_LEN)]
    pub name: String,
}

// A product sold by an issuer, PDA ["type", issuer_pda, id.to_le_bytes()].
#[account]
#[derive(InitSpace)]
pub struct LicenseType {
    // Issuer PDA (not the wallet) that owns this product.
    pub issuer: Pubkey,
    // Issuer-chosen id, unique per issuer; part of the seeds so it's immutable.
    pub id: u64,
    pub price_lamports: u64,
    // How long one purchase/renewal extends the license.
    pub duration_secs: i64,
    // How long after paying the buyer can still get a full refund. 0 = no refunds.
    pub resign_window_secs: i64,
    // false = no new purchases/renewals (existing licenses keep working).
    pub active: bool,
    pub bump: u8,
    #[max_len(MAX_NAME_LEN)]
    pub name: String,
    #[max_len(MAX_DESC_LEN)]
    pub description: String,
}

// One buyer's license for one product, PDA ["license", license_type_pda, owner].
// The account itself is the escrow: besides rent it holds `paid` lamports.
#[account]
#[derive(InitSpace)]
pub struct License {
    pub license_type: Pubkey,
    pub owner: Pubkey,
    // Lamports currently in escrow (last payment not yet paid out/refunded). 0 = settled.
    pub paid: u64,
    // Until this timestamp the owner may resign (refund); after it the issuer may claim.
    pub resign_deadline: i64,
    // expires_at before the last payment; restored on resign to undo that payment's extension.
    pub prev_expires_at: i64,
    // License is valid while now < expires_at. This is what off-chain apps check.
    pub expires_at: i64,
    // Set once the owner used a refund. Afterwards renewals get no resign window
    // (one refund per license, prevents buy/refund loops).
    pub resigned: bool,
    pub bump: u8,
}

// Event emitted on every payout (claim or renew). Shows up in tx logs;
// clients/indexers subscribe to it for accounting.
#[event]
pub struct FeePaid {
    pub license: Pubkey,
    pub license_type: Pubkey,
    // Gross escrow released.
    pub amount: u64,
    // Part of `amount` sent to master.
    pub fee: u64,
}
