use anchor_lang::prelude::*;

// Custom program errors. Anchor numbers them from 6000 upward in declaration order
// (Unauthorized = 6000, IssuerInactive = 6001, ...), so only append new variants at
// the end or client-side error codes will shift.
// Used as `require!(cond, ErrorCode::X)` or `constraint = cond @ ErrorCode::X`.
#[error_code]
pub enum ErrorCode {
    #[msg("Signer is not authorized for this action")]
    Unauthorized,
    #[msg("Issuer is not active")]
    IssuerInactive,
    #[msg("Resign window is still open")]
    ResignWindowOpen,
    #[msg("Resign window has closed")]
    ResignWindowClosed,
    #[msg("No escrow to claim")]
    NothingToClaim,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Invalid license type parameters")]
    InvalidParams,
    #[msg("License type is not active")]
    LicenseTypeInactive,
    #[msg("Name or description too long")]
    TextTooLong,
}
