use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateWalletRequest {
    pub name: String,
    pub mnemonic: Option<String>,
    /// User's password — used to derive encryption key for private key storage
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct ImportWalletRequest {
    pub name: String,
    pub mnemonic: String,
    /// User's password — used to derive encryption key for private key storage
    pub password: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletResponse {
    pub id: Uuid,
    pub name: String,
    pub chain: String,
    pub address: String,
    pub balance: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletWithMnemonic {
    pub wallet: WalletResponse,
    pub mnemonic: String,
}

#[derive(Debug, Deserialize)]
pub struct BalanceRequest {
    pub wallet_id: Uuid,
}
