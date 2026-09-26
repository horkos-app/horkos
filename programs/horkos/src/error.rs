use anchor_lang::prelude::*;

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
}
