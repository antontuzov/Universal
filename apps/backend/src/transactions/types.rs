use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct PaginationQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct SendTransactionRequest {
    pub wallet_id: Uuid,
    pub recipient_address: String,
    pub amount: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct TransactionQuery {
    pub wallet_id: Option<Uuid>,
    pub status: Option<String>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionResponse {
    pub id: Uuid,
    pub wallet_id: Uuid,
    pub chain: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: String,
    pub fee: String,
    pub status: String,
    pub tx_hash: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
