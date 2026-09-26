use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const ISSUER_SEED: &[u8] = b"issuer";

#[constant]
pub const LICENSE_TYPE_SEED: &[u8] = b"type";

#[constant]
pub const LICENSE_SEED: &[u8] = b"license";

#[constant]
pub const MAX_NAME_LEN: u16= 64;

#[constant]
pub const MAX_DESC_LEN: u16 = 256;

#[constant]
pub const FEE_BPS: u16 = 10;

#[constant]
pub const ISSUER_FEE_LAMPORTS: u64 = 1_000_000_000;
