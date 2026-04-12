use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateWalletRequest {
    pub name: String,
    pub mnemonic: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ImportWalletRequest {
    pub name: String,
    pub mnemonic: String,
}

#[derive(Debug, Serialize)]
pub struct WalletResponse {
    pub id: Uuid,
    pub name: String,
    pub chain: String,
    pub address: String,
    pub balance: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct WalletWithMnemonic {
    pub wallet: WalletResponse,
    pub mnemonic: String,
}

#[derive(Debug, Deserialize)]
pub struct BalanceRequest {
    pub wallet_id: Uuid,
}
