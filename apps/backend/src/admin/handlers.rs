use axum::{
    extract::{Query, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use std::sync::Arc;

use crate::state::AppState;
use crate::error::app_error::AppError;
use crate::db::queries;

use super::types::*;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/users", get(list_users))
        .route("/stats", get(system_stats))
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

/// Get system statistics (admin only)
pub async fn system_stats(
    State(_state): State<Arc<AppState>>,
) -> Result<Json<SystemStats>, AppError> {
    // TODO: Query actual statistics from database
    Ok(Json(SystemStats {
        total_users: 0,
        total_wallets: 0,
        total_transactions: 0,
        active_sessions: 0,
        database_status: "connected".to_string(),
    }))
}
