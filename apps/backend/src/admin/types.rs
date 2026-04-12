use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUserResponse {
    pub id: Uuid,
    pub email: String,
    pub role: String,
    pub wallet_count: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStats {
    pub total_users: i64,
    pub total_wallets: i64,
    pub total_transactions: i64,
    pub active_sessions: i64,
    pub database_status: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct PaginationQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
}
