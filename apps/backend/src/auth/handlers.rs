use axum::{
    extract::{State, Extension},
    http::{StatusCode, HeaderMap},
    routing::post,
    Json, Router,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::Duration;
use jsonwebtoken::{encode, EncodingKey, Header};
use std::sync::Arc;
use uuid::Uuid;

use crate::state::AppState;
use crate::error::app_error::AppError;
use crate::db::queries;
use crate::redis;

use super::types::*;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/refresh", post(refresh_token))
        .route("/logout", post(logout))
        .with_state(state)
}

/// Register a new user
pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Check if user already exists
    if queries::get_user_by_email(&state.pool, &req.email)
        .await
        .is_ok()
    {
        return Err(AppError::Conflict("User already exists".to_string()));
    }

    // Hash password with Argon2id
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(req.password.as_bytes(), &salt)
        .map_err(|e| AppError::Internal(format!("Failed to hash password: {}", e)))?
        .to_string();

    // Create user in database
    let user = queries::create_user(&state.pool, &req.email, &password_hash)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to create user: {}", e)))?;

    // Generate JWT tokens
    let access_token = generate_token(user.id, &user.email, &user.role, false)?;
    let refresh_token = generate_token(user.id, &user.email, &user.role, true)?;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: UserResponse {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
        },
    }))
}

/// Login an existing user
pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Get user from database
    let user = queries::get_user_by_email(&state.pool, &req.email)
        .await
        .map_err(|_| AppError::Unauthorized("Invalid credentials".to_string()))?;

    // Verify password
    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| AppError::Internal("Invalid password hash".to_string()))?;

    Argon2::default()
        .verify_password(req.password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized("Invalid credentials".to_string()))?;

    // Generate JWT tokens
    let access_token = generate_token(user.id, &user.email, &user.role, false)?;
    let refresh_token = generate_token(user.id, &user.email, &user.role, true)?;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: UserResponse {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
        },
    }))
}

/// Refresh access token
pub async fn refresh_token(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Decode and validate refresh token
    let claims = verify_token(&req.refresh_token, true)?;

    // Get user from database to ensure they still exist
    let user = queries::get_user_by_id(&state.pool, claims.sub)
        .await
        .map_err(|_| AppError::Unauthorized("Invalid refresh token".to_string()))?;

    // Generate new tokens
    let access_token = generate_token(user.id, &user.email, &user.role, false)?;
    let refresh_token = generate_token(user.id, &user.email, &user.role, true)?;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: UserResponse {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
        },
    }))
}

/// Logout — blacklist the token and invalidate session
pub async fn logout(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, AppError> {
    // Extract and blacklist the current access token
    if let Ok(token) = extract_token(&headers) {
        // Blacklist for remaining access token lifetime (15 min default)
        let _ = redis::blacklist_token(&state.redis, &token, 900).await;
        tracing::info!("🔒 User {} logged out, token blacklisted", claims.email);
    }

    Ok(Json(serde_json::json!({ "message": "Logged out successfully" })))
}

fn extract_token(headers: &HeaderMap) -> Result<String, ()> {
    let auth_header = headers.get("Authorization").ok_or(())?;
    let auth_str = auth_header.to_str().map_err(|_| ())?;
    if auth_str.starts_with("Bearer ") {
        Ok(auth_str[7..].to_string())
    } else {
        Err(())
    }
}

/// Generate JWT token
fn generate_token(
    user_id: Uuid,
    email: &str,
    role: &str,
    is_refresh: bool,
) -> Result<String, AppError> {
    // Parse expiration: use seconds directly, fallback to safe defaults
    let expiration_seconds: i64 = if is_refresh {
        // REFRESH_TOKEN_EXPIRATION in seconds (default 7 days = 604800s)
        std::env::var("REFRESH_TOKEN_EXPIRATION")
            .ok()
            .and_then(|v| v.parse::<i64>().ok())
            .unwrap_or(604800)
    } else {
        // JWT_EXPIRATION in seconds (default 15 minutes = 900s)
        std::env::var("JWT_EXPIRATION")
            .ok()
            .and_then(|v| v.parse::<i64>().ok())
            .unwrap_or(900)
    };

    let exp = chrono::Utc::now()
        .checked_add_signed(Duration::seconds(expiration_seconds))
        .ok_or_else(|| AppError::Internal("Failed to calculate expiration".to_string()))?
        .timestamp();

    let claims = Claims {
        sub: user_id,
        email: email.to_string(),
        role: role.to_string(),
        exp,
    };

    // CRITICAL: JWT_SECRET must be set in production. We panic if missing
    // to prevent accidentally running with a weak default.
    let secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET environment variable must be set in production");

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("Failed to encode token: {}", e)))
}

/// Verify JWT token
fn verify_token(token: &str, _is_refresh: bool) -> Result<Claims, AppError> {
    use jsonwebtoken::{decode, DecodingKey, Validation};

    let secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET environment variable must be set");

    let validation = Validation::default();

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|e| AppError::Unauthorized(format!("Invalid token: {}", e)))
}
