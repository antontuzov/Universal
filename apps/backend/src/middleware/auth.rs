use axum::{
    body::Body,
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::sync::Arc;

use crate::auth::Claims;
use crate::state::AppState;
use crate::redis;

/// Authentication middleware that validates JWT tokens
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = extract_token(&headers)?;
    let claims = verify_token(&token)?;

    // Check if token is blacklisted in Redis
    if redis::is_token_blacklisted(&state.redis, &token).await.unwrap_or(false) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Add claims to request extensions for downstream access
    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}

/// Admin guard middleware that checks if user has admin role
pub async fn admin_guard(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = extract_token(&headers)?;
    let claims = verify_token(&token)?;

    // Check if token is blacklisted
    if redis::is_token_blacklisted(&state.redis, &token).await.unwrap_or(false) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    if claims.role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}

/// Extract bearer token from Authorization header
fn extract_token(headers: &HeaderMap) -> Result<String, StatusCode> {
    let auth_header = headers
        .get("Authorization")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let auth_str = auth_header
        .to_str()
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    if !auth_str.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(auth_str[7..].to_string())
}

/// Verify JWT token and return claims
fn verify_token(token: &str) -> Result<Claims, StatusCode> {
    let secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET environment variable must be set");

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| StatusCode::UNAUTHORIZED)
}
