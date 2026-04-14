use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize)]
pub struct SystemHealthResponse {
    pub database_status: String,
    pub redis_status: String,
    pub uptime_seconds: i64,
    pub total_users: i64,
    pub total_wallets: i64,
    pub total_transactions: i64,
    pub active_sessions: i64,
}
