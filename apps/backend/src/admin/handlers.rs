use axum::{
    extract::{Query, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use fred::interfaces::ClientLike;
use sqlx::Row;
use std::sync::Arc;

use crate::state::AppState;
use crate::error::app_error::AppError;
use crate::db::queries;

use super::types::*;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/users", get(list_users))
        .route("/health", get(system_health))
        .route("/audit-logs", get(audit_logs))
        .with_state(state)
}

/// List all users (admin only)
pub async fn list_users(
    State(state): State<Arc<AppState>>,
    Query(pagination): Query<PaginationQuery>,
) -> Result<Json<Vec<AdminUserResponse>>, AppError> {
    let page = pagination.page.unwrap_or(1);
    let limit = pagination.limit.unwrap_or(20);
    let offset = (page - 1) * limit;

    let users = queries::get_all_users(&state.pool, limit, offset)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch users: {}", e)))?;

    // TODO: Get wallet count for each user
    let response: Vec<AdminUserResponse> = users
        .into_iter()
        .map(|u| AdminUserResponse {
            id: u.id,
            email: u.email,
            role: u.role,
            wallet_count: 0, // Placeholder
            created_at: u.created_at,
        })
        .collect();

    Ok(Json(response))
}

/// Get system health (admin only)
pub async fn system_health(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Check database
    let db_status = sqlx::query("SELECT 1")
        .fetch_one(&state.pool)
        .await
        .map(|_| "connected".to_string())
        .unwrap_or_else(|_| "disconnected".to_string());

    // Check Redis
    let redis_status: String = match state.redis.ping::<String>().await {
        Ok(_) => "connected".to_string(),
        Err(_) => "disconnected".to_string(),
    };

    // Get counts
    let total_users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&state.pool)
        .await
        .unwrap_or((0,));

    let total_wallets: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM wallets")
        .fetch_one(&state.pool)
        .await
        .unwrap_or((0,));

    let total_transactions: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM transactions")
        .fetch_one(&state.pool)
        .await
        .unwrap_or((0,));

    Ok(Json(serde_json::json!({
        "databaseStatus": db_status,
        "redisStatus": redis_status,
        "uptimeSeconds": 0,
        "totalUsers": total_users.0,
        "totalWallets": total_wallets.0,
        "totalTransactions": total_transactions.0,
        "activeSessions": 0
    })))
}

/// Get audit logs (admin only)
pub async fn audit_logs(
    State(state): State<Arc<AppState>>,
    axum::extract::Query(pagination): axum::extract::Query<super::types::PaginationQuery>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let page = pagination.page.unwrap_or(1);
    let limit = pagination.limit.unwrap_or(50);
    let offset = (page - 1) * limit;

    let logs = sqlx::query(
        "SELECT id, user_id, action, details, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Failed to fetch audit logs: {}", e)))?;

    let response: Vec<serde_json::Value> = logs
        .into_iter()
        .map(|log| {
            let id: uuid::Uuid = log.get("id");
            let user_id: Option<uuid::Uuid> = log.get("user_id");
            let action: String = log.get("action");
            let details: Option<serde_json::Value> = log.get("details");
            let ip_address: Option<String> = log.get("ip_address");
            let created_at: chrono::DateTime<chrono::Utc> = log.get("created_at");

            serde_json::json!({
                "id": id,
                "userId": user_id,
                "action": action,
                "details": details,
                "ipAddress": ip_address,
                "createdAt": created_at
            })
        })
        .collect();

    Ok(Json(response))
}
