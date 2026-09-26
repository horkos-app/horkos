use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub master: Pubkey,
    pub fee_bps: u16,
    pub issuer_fee_lamports: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Issuer {
    pub authority: Pubkey,
    pub active: bool,
    pub bump: u8,
    #[max_len(MAX_NAME_LEN)]
    pub name: String,
}

#[account]
#[derive(InitSpace)]
pub struct LicenseType {
    pub issuer: Pubkey,
    pub id: u64,
    pub price_lamports: u64,
    pub duration_secs: i64,
    pub resign_window_secs: i64,
    pub active: bool,
    pub bump: u8,
    #[max_len(MAX_NAME_LEN)]
    pub name: String,
    #[max_len(MAX_DESC_LEN)]
    pub description: String,
}

#[account]
#[derive(InitSpace)]
pub struct License {
    pub license_type: Pubkey,
    pub owner: Pubkey,
    pub paid: u64,
    pub resign_deadline: i64,
    pub prev_expires_at: i64,
    pub expires_at: i64,
    pub resigned: bool,
    pub bump: u8,
}
