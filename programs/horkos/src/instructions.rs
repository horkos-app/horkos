// One module per instruction. Glob re-exports make the `Accounts` structs visible
// at crate root, which `#[program]` in lib.rs needs (`Context<InitConfig>` etc.).
pub mod claim;
pub mod create_license_type;
pub mod init_config;
pub mod purchase;
pub mod purchase_issuer;
pub mod renew;
pub mod resign;
pub mod update_config;
pub mod update_issuer;
pub mod update_license_type;

pub use claim::*;
pub use create_license_type::*;
pub use init_config::*;
pub use purchase::*;
pub use purchase_issuer::*;
pub use renew::*;
pub use resign::*;
pub use update_config::*;
pub use update_issuer::*;
pub use update_license_type::*;
