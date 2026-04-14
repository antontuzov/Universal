use axum::{
    middleware,
    routing::{get, post},
    Router,
};
use axum::http::HeaderValue;
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use std::sync::Arc;
use fred::prelude::*;

use crate::state::AppState;
use crate::middleware::auth::{auth_middleware, admin_guard};
use crate::redis;

fn cors_layer() -> CorsLayer {
    let origins: Vec<HeaderValue> = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:80",
    ]
    .iter()
    .map(|s| s.parse().unwrap())
    .collect();

    CorsLayer::new()
        .allow_origin(origins)
        .allow_methods(Any)
        .allow_headers(Any)
}

pub async fn create_router(pool: PgPool) -> Router {
    // Initialize Redis (fail gracefully if unavailable)
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://localhost:6379".to_string());

    let redis = match redis::create_redis_client(&redis_url).await {
        Ok(client) => client,
        Err(e) => {
            tracing::warn!("⚠️  Redis unavailable: {}. Some features disabled.", e);
            // Create a dummy client that will fail gracefully
            let config = RedisConfig::from_url("redis://localhost:6379")
                .unwrap_or_else(|_| RedisConfig::default());
            let client = RedisClient::new(config, None, None, Some(ReconnectPolicy::default()));
            client
        }
    };

    let state = Arc::new(AppState::new(pool, redis));

    // Public routes (no auth required)
    let public_routes = Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/api/auth/register", post(crate::auth::register))
        .route("/api/auth/login", post(crate::auth::login))
        .route("/api/auth/refresh", post(crate::auth::refresh_token))
        .route("/api/auth/logout", post(crate::auth::logout).layer(middleware::from_fn_with_state(state.clone(), auth_middleware)));

    // Protected routes (auth required)
    let protected_routes = Router::new()
        .route("/api/wallets", get(crate::wallet::list_wallets))
        .route("/api/wallets/create", post(crate::wallet::create_wallet))
        .route("/api/wallets/import", post(crate::wallet::import_wallet))
        .route("/api/transactions", get(crate::transactions::list_transactions))
        .route("/api/transactions/send", post(crate::transactions::send_transaction))
        .nest("/api/user", crate::user::router(state.clone()))
        .route_layer(middleware::from_fn_with_state(state.clone(), auth_middleware));

    // Admin routes (auth + admin role required)
    let admin_routes = Router::new()
        .route("/api/admin/users", get(crate::admin::list_users))
        .route("/api/admin/health", get(crate::admin::system_health))
        .route("/api/admin/audit-logs", get(crate::admin::audit_logs))
        .route_layer(middleware::from_fn_with_state(state.clone(), admin_guard));

    // Merge all routes and apply state
    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .merge(admin_routes)
        .with_state(state)
        .layer(cors_layer())
        .layer(TraceLayer::new_for_http())
}
