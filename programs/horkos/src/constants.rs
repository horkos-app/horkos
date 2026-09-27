use anchor_lang::prelude::*;

// `#[constant]` exports the value into the IDL so clients can read it
// (e.g. to derive PDAs with the same seeds) instead of hardcoding it.

// PDA seed prefixes. A PDA address = hash(seeds, program_id), so the prefix
// keeps the different account kinds from colliding with each other.
#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const ISSUER_SEED: &[u8] = b"issuer";

#[constant]
pub const LICENSE_TYPE_SEED: &[u8] = b"type";

#[constant]
pub const LICENSE_SEED: &[u8] = b"license";

// Max string lengths in BYTES (not chars; UTF-8 multi-byte chars count more).
// Used by `#[max_len]` in state.rs to size accounts and by the validation in handlers.
#[constant]
pub const MAX_NAME_LEN: u16= 64;

#[constant]
pub const MAX_DESC_LEN: u16 = 256;

// Protocol fee in basis points: 100 bps = 1%. Taken from every payout to the issuer.
#[constant]
pub const FEE_BPS: u16 = 100;

// Initial price of becoming an issuer: 1 SOL (1 SOL = 1_000_000_000 lamports).
// Stored into Config at init; later changed via update_config.
#[constant]
pub const ISSUER_FEE_LAMPORTS: u64 = 1_000_000_000;
