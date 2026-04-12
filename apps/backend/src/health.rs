use axum::{extract::State, http::StatusCode};
use std::sync::Arc;

use crate::state::AppState;

pub async fn health(
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, StatusCode> {
    // Check database connection
    sqlx::query("SELECT 1")
        .fetch_one(&state.pool)
        .await
        .map(|_| StatusCode::OK)
        .map_err(|_| StatusCode::SERVICE_UNAVAILABLE)
}
