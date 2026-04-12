use axum::{
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use std::sync::Arc;

use crate::state::AppState;

pub fn create_router(pool: PgPool) -> Router {
    let state = Arc::new(AppState::new(pool));

    Router::new()
        // Health check  
        .route("/health", get(|| async { "OK" }))
        // Auth routes
        .route("/api/auth/register", post(crate::auth::register))
        .route("/api/auth/login", post(crate::auth::login))
        .route("/api/auth/refresh", post(crate::auth::refresh_token))
        // Wallet routes
        .route("/api/wallets", get(crate::wallet::list_wallets))
        .route("/api/wallets/create", post(crate::wallet::create_wallet))
        .route("/api/wallets/import", post(crate::wallet::import_wallet))
        // Transaction routes
        .route("/api/transactions/send", post(crate::transactions::send_transaction))
        // Admin routes
        .route("/api/admin/users", get(crate::admin::list_users))
        .route("/api/admin/stats", get(crate::admin::system_stats))
        // Add state
        .with_state(state)
        // Layers (must come after with_state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
}
