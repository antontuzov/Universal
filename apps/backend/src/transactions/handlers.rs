use axum::{
    extract::{Query, State, Extension},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use std::sync::Arc;

use crate::state::AppState;
use crate::error::app_error::AppError;
use crate::db::transaction_queries::{get_user_transactions, get_user_transaction_count};
use crate::auth::Claims;

use super::types::*;
use super::types::PaginationQuery;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/", get(list_transactions))
        .route("/send", post(send_transaction))
        .with_state(state)
}

/// List transactions for the authenticated user
pub async fn list_transactions(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(pagination): Query<PaginationQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let page = pagination.page.unwrap_or(1);
    let limit = pagination.limit.unwrap_or(50);
    let offset = (page - 1) * limit;

    let transactions = get_user_transactions(&state.pool, claims.sub, limit, offset)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch transactions: {}", e)))?;

    let total = get_user_transaction_count(&state.pool, claims.sub)
        .await
        .unwrap_or(0);

    Ok(Json(serde_json::json!({
        "transactions": transactions,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total as f64 / limit as f64).ceil() as i64
        }
    })))
}

/// Send a transaction
pub async fn send_transaction(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<SendTransactionRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // TODO: Implement transaction creation and signing
    // 1. Get wallet from database
    // 2. Decrypt private key using user's password
    // 3. Create and sign transaction
    // 4. Broadcast to blockchain
    // 5. Store transaction record
    Err(AppError::Internal("Transaction sending not yet implemented".to_string()))
}
