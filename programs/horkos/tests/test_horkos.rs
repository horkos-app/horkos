use {
    anchor_lang::{
        prelude::{Clock, Pubkey},
        solana_program::{bpf_loader_upgradeable, instruction::Instruction, system_program},
        AccountDeserialize, InstructionData, Space, ToAccountMetas,
    },
    horkos::{accounts as acc, constants::*, instruction as ix, state::*},
    litesvm::{types::TransactionResult, LiteSVM},
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

const ID: u64 = 1;
const PRICE: u64 = 1_000_000_000;
const DURATION: i64 = 1_000;
const WINDOW: i64 = 100;
const NAME: &str = "Pro";
const DESC: &str = "Pro license";
const FEE: u64 = PRICE * FEE_BPS as u64 / 10_000;

fn pda(seeds: &[&[u8]]) -> Pubkey {
    Pubkey::find_program_address(seeds, &horkos::id()).0
}

fn config_pda() -> Pubkey {
    pda(&[CONFIG_SEED])
}

fn program_data_pda() -> Pubkey {
    Pubkey::find_program_address(&[horkos::id().as_ref()], &bpf_loader_upgradeable::ID).0
}

fn send(
    svm: &mut LiteSVM,
    data: impl InstructionData,
    accounts: impl ToAccountMetas,
    signer: &Keypair,
) -> TransactionResult {
    svm.expire_blockhash();
    let ix = Instruction::new_with_bytes(horkos::id(), &data.data(), accounts.to_account_metas(None));
    let msg = Message::new_with_blockhash(&[ix], Some(&signer.pubkey()), &svm.latest_blockhash());
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[signer]).unwrap();
    svm.send_transaction(tx)
}

fn ok(res: TransactionResult) {
    if let Err(e) = res {
        panic!("{:#?}", e.meta.logs);
    }
}

fn fails(res: TransactionResult, code: &str) {
    let Err(e) = res else { panic!("expected {code}") };
    assert!(e.meta.logs.iter().any(|l| l.contains(code)), "{code} not in {:#?}", e.meta.logs);
}

struct Env {
    svm: LiteSVM,
    master: Keypair,
    issuer: Keypair,
    buyer: Keypair,
}

impl Env {
    fn bare() -> Self {
        let mut svm = LiteSVM::new();
        let bytes = include_bytes!(concat!(env!("CARGO_TARGET_TMPDIR"), "/../deploy/horkos.so"));
        svm.add_program(horkos::id(), bytes).unwrap();
        let (master, issuer, buyer) = (Keypair::new(), Keypair::new(), Keypair::new());
        for k in [&master, &issuer, &buyer] {
            svm.airdrop(&k.pubkey(), 10 * PRICE).unwrap();
        }
        let addr = program_data_pda();
        let mut program_data = svm.get_account(&addr).unwrap();
        program_data.data[12] = 1;
        program_data.data[13..45].copy_from_slice(master.pubkey().as_ref());
        svm.set_account(addr, program_data).unwrap();
        Self { svm, master, issuer, buyer }
    }

    fn new() -> Self {
        let mut env = Self::bare();
        ok(env.init_config(None));
        env
    }

    fn with_type() -> Self {
        let mut env = Self::new();
        ok(env.buy_issuer(None));
        ok(env.create_type(DURATION, WINDOW));
        env
    }

    fn stranger(&mut self) -> Keypair {
        let k = Keypair::new();
        self.svm.airdrop(&k.pubkey(), PRICE).unwrap();
        k
    }

    fn issuer_pda(&self) -> Pubkey {
        pda(&[ISSUER_SEED, self.issuer.pubkey().as_ref()])
    }

    fn type_pda(&self) -> Pubkey {
        pda(&[LICENSE_TYPE_SEED, self.issuer_pda().as_ref(), &ID.to_le_bytes()])
    }

    fn license_pda(&self) -> Pubkey {
        pda(&[LICENSE_SEED, self.type_pda().as_ref(), self.buyer.pubkey().as_ref()])
    }

    fn read<T: AccountDeserialize>(&self, addr: Pubkey) -> T {
        T::try_deserialize(&mut self.svm.get_account(&addr).unwrap().data.as_slice()).unwrap()
    }

    fn lamports(&self, addr: Pubkey) -> u64 {
        self.svm.get_account(&addr).map_or(0, |a| a.lamports)
    }

    fn license_rent(&self) -> u64 {
        self.svm.minimum_balance_for_rent_exemption(8 + License::INIT_SPACE)
    }

    fn now(&self) -> i64 {
        self.svm.get_sysvar::<Clock>().unix_timestamp
    }

    fn warp(&mut self, secs: i64) {
        let mut clock = self.svm.get_sysvar::<Clock>();
        clock.unix_timestamp += secs;
        self.svm.set_sysvar(&clock);
    }

    fn init_config(&mut self, by: Option<&Keypair>) -> TransactionResult {
        let by = by.unwrap_or(&self.master);
        let accounts = acc::InitConfig {
            master: by.pubkey(),
            config: config_pda(),
            program_data: program_data_pda(),
            system_program: system_program::ID,
        };
        send(&mut self.svm, ix::InitConfig {}, accounts, by)
    }

    fn update_config(&mut self, by: Option<&Keypair>, issuer_fee_lamports: u64) -> TransactionResult {
        let by = by.unwrap_or(&self.master);
        let accounts = acc::UpdateConfig {
            master: by.pubkey(),
            config: config_pda(),
        };
        send(&mut self.svm, ix::UpdateConfig { issuer_fee_lamports }, accounts, by)
    }

    fn update_fee(&mut self, by: Option<&Keypair>, fee_bps: u16) -> TransactionResult {
        let by = by.unwrap_or(&self.master);
        let accounts = acc::UpdateConfig {
            master: by.pubkey(),
            config: config_pda(),
        };
        send(&mut self.svm, ix::UpdateFee { fee_bps }, accounts, by)
    }

    fn buy_issuer(&mut self, master: Option<Pubkey>) -> TransactionResult {
        let accounts = acc::PurchaseIssuer {
            authority: self.issuer.pubkey(),
            master: master.unwrap_or(self.master.pubkey()),
            config: config_pda(),
            issuer: self.issuer_pda(),
            system_program: system_program::ID,
        };
        send(&mut self.svm, ix::PurchaseIssuer { name: NAME.into() }, accounts, &self.issuer)
    }

    fn update_issuer(&mut self, by: Option<&Keypair>, active: bool) -> TransactionResult {
        let by = by.unwrap_or(&self.master);
        let accounts = acc::UpdateIssuer {
            master: by.pubkey(),
            config: config_pda(),
            issuer: self.issuer_pda(),
        };
        send(&mut self.svm, ix::UpdateIssuer { active }, accounts, by)
    }

    fn create_type(&mut self, duration_secs: i64, resign_window_secs: i64) -> TransactionResult {
        let accounts = acc::CreateLicenseType {
            authority: self.issuer.pubkey(),
            issuer: self.issuer_pda(),
            license_type: self.type_pda(),
            system_program: system_program::ID,
        };
        let data = ix::CreateLicenseType {
            id: ID,
            price_lamports: PRICE,
            duration_secs,
            resign_window_secs,
            name: NAME.into(),
            description: DESC.into(),
        };
        send(&mut self.svm, data, accounts, &self.issuer)
    }

    fn update_type(
        &mut self,
        by: Option<&Keypair>,
        price_lamports: u64,
        duration_secs: i64,
        resign_window_secs: i64,
        active: bool,
    ) -> TransactionResult {
        let by = by.unwrap_or(&self.issuer);
        let accounts = acc::UpdateLicenseType {
            authority: by.pubkey(),
            issuer: self.issuer_pda(),
            license_type: self.type_pda(),
        };
        let data = ix::UpdateLicenseType {
            price_lamports,
            duration_secs,
            resign_window_secs,
            active,
            name: NAME.into(),
            description: DESC.into(),
        };
        send(&mut self.svm, data, accounts, by)
    }

    fn deactivate_type(&mut self) {
        ok(self.update_type(None, PRICE, DURATION, WINDOW, false));
    }

    fn purchase(&mut self) -> TransactionResult {
        let accounts = acc::Purchase {
            owner: self.buyer.pubkey(),
            issuer: self.issuer_pda(),
            license_type: self.type_pda(),
            license: self.license_pda(),
            system_program: system_program::ID,
        };
        send(&mut self.svm, ix::Purchase {}, accounts, &self.buyer)
    }

    fn renew(&mut self) -> TransactionResult {
        let accounts = acc::Renew {
            owner: self.buyer.pubkey(),
            config: config_pda(),
            master: self.master.pubkey(),
            issuer: self.issuer_pda(),
            authority: self.issuer.pubkey(),
            license_type: self.type_pda(),
            license: self.license_pda(),
            system_program: system_program::ID,
        };
        send(&mut self.svm, ix::Renew {}, accounts, &self.buyer)
    }

    fn resign(&mut self) -> TransactionResult {
        let accounts = acc::Resign {
            owner: self.buyer.pubkey(),
            license_type: self.type_pda(),
            license: self.license_pda(),
        };
        send(&mut self.svm, ix::Resign {}, accounts, &self.buyer)
    }

    fn claim(&mut self) -> TransactionResult {
        let accounts = acc::Claim {
            authority: self.issuer.pubkey(),
            config: config_pda(),
            master: self.master.pubkey(),
            issuer: self.issuer_pda(),
            license_type: self.type_pda(),
            license: self.license_pda(),
        };
        send(&mut self.svm, ix::Claim {}, accounts, &self.issuer)
    }
}

#[test]
fn init_config_sets_master_and_fee() {
    let mut env = Env::new();
    let config: Config = env.read(config_pda());
    assert_eq!(config.master, env.master.pubkey());
    assert_eq!(config.fee_bps, FEE_BPS);
    assert_eq!(config.issuer_fee_lamports, ISSUER_FEE_LAMPORTS);
    assert!(env.init_config(None).is_err());
}

#[test]
fn init_config_requires_upgrade_authority() {
    let mut env = Env::bare();
    let stranger = env.stranger();
    fails(env.init_config(Some(&stranger)), "Unauthorized");
    ok(env.init_config(None));
}

#[test]
fn update_config_changes_issuer_fee() {
    let mut env = Env::new();
    ok(env.update_config(None, 2 * ISSUER_FEE_LAMPORTS));
    assert_eq!(env.read::<Config>(config_pda()).issuer_fee_lamports, 2 * ISSUER_FEE_LAMPORTS);
    let master_before = env.lamports(env.master.pubkey());
    ok(env.buy_issuer(None));
    assert_eq!(env.lamports(env.master.pubkey()) - master_before, 2 * ISSUER_FEE_LAMPORTS);
}

#[test]
fn update_config_rejects_non_master() {
    let mut env = Env::new();
    let stranger = env.stranger();
    fails(env.update_config(Some(&stranger), 0), "Unauthorized");
}

#[test]
fn update_fee_changes_fee_bps() {
    let mut env = Env::new();
    ok(env.update_fee(None, 100));
    assert_eq!(env.read::<Config>(config_pda()).fee_bps, 100);
    fails(env.update_fee(None, 10_001), "InvalidParams");
}

#[test]
fn update_fee_rejects_non_master() {
    let mut env = Env::new();
    let stranger = env.stranger();
    fails(env.update_fee(Some(&stranger), 100), "Unauthorized");
}

#[test]
fn purchase_issuer_pays_master_and_activates() {
    let mut env = Env::new();
    let master_before = env.lamports(env.master.pubkey());
    ok(env.buy_issuer(None));
    assert_eq!(env.lamports(env.master.pubkey()) - master_before, ISSUER_FEE_LAMPORTS);
    let issuer: Issuer = env.read(env.issuer_pda());
    assert_eq!(issuer.authority, env.issuer.pubkey());
    assert!(issuer.active);
}

#[test]
fn purchase_issuer_rejects_wrong_master() {
    let mut env = Env::new();
    let stranger = env.stranger();
    fails(env.buy_issuer(Some(stranger.pubkey())), "Unauthorized");
}

#[test]
fn purchase_issuer_rejects_repurchase_after_deactivation() {
    let mut env = Env::new();
    ok(env.buy_issuer(None));
    ok(env.update_issuer(None, false));
    fails(env.buy_issuer(None), "already in use");
    assert!(!env.read::<Issuer>(env.issuer_pda()).active);
}

#[test]
fn update_issuer_toggles_active() {
    let mut env = Env::new();
    ok(env.buy_issuer(None));
    ok(env.update_issuer(None, false));
    assert!(!env.read::<Issuer>(env.issuer_pda()).active);
    ok(env.update_issuer(None, true));
    assert!(env.read::<Issuer>(env.issuer_pda()).active);
}

#[test]
fn update_issuer_rejects_non_master() {
    let mut env = Env::new();
    ok(env.buy_issuer(None));
    let stranger = env.stranger();
    fails(env.update_issuer(Some(&stranger), false), "Unauthorized");
}

#[test]
fn create_license_type_stores_fields() {
    let env = Env::with_type();
    let lt: LicenseType = env.read(env.type_pda());
    assert_eq!(lt.issuer, env.issuer_pda());
    assert_eq!(lt.id, ID);
    assert_eq!(lt.price_lamports, PRICE);
    assert_eq!(lt.duration_secs, DURATION);
    assert_eq!(lt.resign_window_secs, WINDOW);
    assert!(lt.active);
    assert_eq!(lt.name, NAME);
    assert_eq!(lt.description, DESC);
}

#[test]
fn create_license_type_rejects_bad_params() {
    let mut env = Env::new();
    ok(env.buy_issuer(None));
    fails(env.create_type(WINDOW, DURATION), "InvalidParams");
    fails(env.create_type(0, 0), "InvalidParams");
    fails(env.create_type(DURATION, -1), "InvalidParams");
}

#[test]
fn zero_resign_window_allows_no_refund_and_immediate_claim() {
    let mut env = Env::new();
    ok(env.buy_issuer(None));
    ok(env.create_type(DURATION, 0));
    ok(env.purchase());
    fails(env.resign(), "ResignWindowClosed");
    ok(env.claim());
}

#[test]
fn create_license_type_rejects_inactive_issuer() {
    let mut env = Env::new();
    ok(env.buy_issuer(None));
    ok(env.update_issuer(None, false));
    fails(env.create_type(DURATION, WINDOW), "IssuerInactive");
}

#[test]
fn update_license_type_changes_fields() {
    let mut env = Env::with_type();
    ok(env.update_type(None, 2 * PRICE, 2 * DURATION, 2 * WINDOW, false));
    let lt: LicenseType = env.read(env.type_pda());
    assert_eq!(lt.price_lamports, 2 * PRICE);
    assert_eq!(lt.duration_secs, 2 * DURATION);
    assert_eq!(lt.resign_window_secs, 2 * WINDOW);
    assert!(!lt.active);
}

#[test]
fn update_license_type_rejects_bad_params() {
    let mut env = Env::with_type();
    fails(env.update_type(None, PRICE, WINDOW, DURATION, true), "InvalidParams");
}

#[test]
fn update_license_type_rejects_other_authority() {
    let mut env = Env::with_type();
    let stranger = env.stranger();
    fails(env.update_type(Some(&stranger), 0, DURATION, WINDOW, true), "ConstraintSeeds");
}

#[test]
fn purchase_escrows_price() {
    let mut env = Env::with_type();
    ok(env.purchase());
    let now = env.now();
    let license: License = env.read(env.license_pda());
    assert_eq!(license.license_type, env.type_pda());
    assert_eq!(license.owner, env.buyer.pubkey());
    assert_eq!(license.paid, PRICE);
    assert_eq!(license.resign_deadline, now + WINDOW);
    assert_eq!(license.prev_expires_at, now);
    assert_eq!(license.expires_at, now + DURATION);
    assert!(!license.resigned);
    assert_eq!(env.lamports(env.license_pda()), env.license_rent() + PRICE);
}

#[test]
fn purchase_rejects_inactive_license_type() {
    let mut env = Env::with_type();
    env.deactivate_type();
    fails(env.purchase(), "LicenseTypeInactive");
}

#[test]
fn purchase_rejects_inactive_issuer() {
    let mut env = Env::with_type();
    ok(env.update_issuer(None, false));
    fails(env.purchase(), "IssuerInactive");
}

#[test]
fn renew_pays_out_and_extends() {
    let mut env = Env::with_type();
    ok(env.purchase());
    let first: License = env.read(env.license_pda());
    env.warp(WINDOW + 1);
    let issuer_before = env.lamports(env.issuer.pubkey());
    let master_before = env.lamports(env.master.pubkey());

    ok(env.renew());

    assert_eq!(env.lamports(env.issuer.pubkey()) - issuer_before, PRICE - FEE);
    assert_eq!(env.lamports(env.master.pubkey()) - master_before, FEE);
    let license: License = env.read(env.license_pda());
    assert_eq!(license.paid, PRICE);
    assert_eq!(license.resign_deadline, env.now() + WINDOW);
    assert_eq!(license.prev_expires_at, first.expires_at);
    assert_eq!(license.expires_at, first.expires_at + DURATION);
    assert_eq!(env.lamports(env.license_pda()), env.license_rent() + PRICE);
}

#[test]
fn renew_rejects_open_resign_window() {
    let mut env = Env::with_type();
    ok(env.purchase());
    fails(env.renew(), "ResignWindowOpen");
}

#[test]
fn renew_rejects_inactive_license_type() {
    let mut env = Env::with_type();
    ok(env.purchase());
    env.warp(WINDOW + 1);
    env.deactivate_type();
    fails(env.renew(), "LicenseTypeInactive");
}

#[test]
fn resign_first_license_refunds_and_keeps_account() {
    let mut env = Env::with_type();
    ok(env.purchase());
    let first: License = env.read(env.license_pda());
    let buyer_before = env.lamports(env.buyer.pubkey());

    ok(env.resign());

    assert!(env.lamports(env.buyer.pubkey()) > buyer_before + PRICE - 10_000);
    let license: License = env.read(env.license_pda());
    assert_eq!(license.paid, 0);
    assert!(license.resigned);
    assert_eq!(license.expires_at, first.prev_expires_at);
    assert_eq!(license.resign_deadline, env.now());
    assert_eq!(env.lamports(env.license_pda()), env.license_rent());
}

#[test]
fn resign_blocks_repurchase() {
    let mut env = Env::with_type();
    ok(env.purchase());
    ok(env.resign());
    env.warp(1);
    fails(env.purchase(), "already in use");
}

#[test]
fn resign_rejects_second_resign() {
    let mut env = Env::with_type();
    ok(env.purchase());
    ok(env.resign());
    fails(env.resign(), "ResignWindowClosed");
}

#[test]
fn renew_after_resign_has_no_window() {
    let mut env = Env::with_type();
    ok(env.purchase());
    ok(env.resign());

    ok(env.renew());

    let now = env.now();
    let license: License = env.read(env.license_pda());
    assert!(license.resigned);
    assert_eq!(license.paid, PRICE);
    assert_eq!(license.resign_deadline, now);
    assert_eq!(license.expires_at, now + DURATION);
    fails(env.resign(), "ResignWindowClosed");
    env.warp(1);
    ok(env.claim());
}

#[test]
fn resign_after_renew_refunds_and_rolls_back() {
    let mut env = Env::with_type();
    ok(env.purchase());
    let first: License = env.read(env.license_pda());
    env.warp(WINDOW + 1);
    ok(env.renew());

    ok(env.resign());

    let license: License = env.read(env.license_pda());
    assert_eq!(license.paid, 0);
    assert!(license.resigned);
    assert_eq!(license.expires_at, first.expires_at);
    assert_eq!(license.resign_deadline, env.now());
    assert_eq!(env.lamports(env.license_pda()), env.license_rent());
}

#[test]
fn resign_rejects_closed_window() {
    let mut env = Env::with_type();
    ok(env.purchase());
    env.warp(WINDOW + 1);
    fails(env.resign(), "ResignWindowClosed");
}

#[test]
fn claim_emits_fee_event() {
    let mut env = Env::with_type();
    ok(env.purchase());
    env.warp(WINDOW + 1);
    let logs = env.claim().unwrap().logs;
    assert!(logs.iter().any(|l| l.starts_with("Program data: ")));
}

#[test]
fn claim_pays_issuer_and_master() {
    let mut env = Env::with_type();
    ok(env.purchase());
    env.warp(WINDOW + 1);
    let issuer_before = env.lamports(env.issuer.pubkey());
    let master_before = env.lamports(env.master.pubkey());

    ok(env.claim());

    assert!(env.lamports(env.issuer.pubkey()) > issuer_before + PRICE - FEE - 10_000);
    assert_eq!(env.lamports(env.master.pubkey()) - master_before, FEE);
    assert_eq!(env.read::<License>(env.license_pda()).paid, 0);
    assert_eq!(env.lamports(env.license_pda()), env.license_rent());
    fails(env.claim(), "NothingToClaim");
}

#[test]
fn claim_rejects_open_resign_window() {
    let mut env = Env::with_type();
    ok(env.purchase());
    fails(env.claim(), "ResignWindowOpen");
}
