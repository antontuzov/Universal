use axum::{
    extract::State,
    http::StatusCode,
    routing::post,
    Json, Router,
};
use std::sync::Arc;

use crate::state::AppState;
use crate::error::app_error::AppError;
use crate::middleware::auth::auth_middleware;

use super::types::*;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/send", post(send_transaction))
        .with_state(state)
}

/// Send a transaction
pub async fn send_transaction(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<SendTransactionRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    // TODO: Implement transaction creation and signing
    // 1. Get wallet from database
    // 2. Decrypt private key using user's password
    // 3. Create and sign transaction
    // 4. Broadcast to blockchain
    // 5. Store transaction record
    
    Err(AppError::Internal("Not implemented yet".to_string()))
}
