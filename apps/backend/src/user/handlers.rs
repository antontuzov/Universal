use axum::{
    extract::{State, Extension},
    routing::post,
    Json, Router,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use std::sync::Arc;

use crate::state::AppState;
use crate::error::app_error::AppError;
use crate::db::queries;
use crate::auth::Claims;

#[derive(Debug, serde::Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

pub fn router(state: Arc<AppState>) -> Router<Arc<AppState>> {
    Router::new()
        .route("/change-password", post(change_password))
        .with_state(state)
}

/// Change user password
pub async fn change_password(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<ChangePasswordRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Get current user
    let user = queries::get_user_by_id(&state.pool, claims.sub)
        .await
        .map_err(|_| AppError::NotFound("User not found".to_string()))?;

    // Verify current password
    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| AppError::Internal("Invalid password hash".to_string()))?;

    Argon2::default()
        .verify_password(req.current_password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized("Current password is incorrect".to_string()))?;

    // Validate new password is different from current
    if Argon2::default()
        .verify_password(req.new_password.as_bytes(), &parsed_hash)
        .is_ok()
    {
        return Err(AppError::BadRequest("New password must be different from current password".to_string()));
    }

    // Validate new password strength
    if req.new_password.len() < 8 {
        return Err(AppError::BadRequest("New password must be at least 8 characters".to_string()));
    }

    // Hash new password
    let salt = SaltString::generate(&mut OsRng);
    let new_password_hash = Argon2::default()
        .hash_password(req.new_password.as_bytes(), &salt)
        .map_err(|e| AppError::Internal(format!("Failed to hash password: {}", e)))?
        .to_string();

    // Update in database
    sqlx::query(
        "UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1"
    )
    .bind(user.id)
    .bind(&new_password_hash)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Failed to update password: {}", e)))?;

    Ok(Json(serde_json::json!({
        "message": "Password changed successfully"
    })))
}
