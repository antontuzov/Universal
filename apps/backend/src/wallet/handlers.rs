use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::state::AppState;
use crate::error::app_error::AppError;
use crate::db::queries;
use crate::middleware::auth::auth_middleware;

use super::types::*;
use super::hd_wallet;
use super::encryption;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/", get(list_wallets))
        .route("/create", post(create_wallet))
        .route("/import", post(import_wallet))
        .route("/:id/balance", get(get_balance))
        .layer(axum::middleware::from_fn(auth_middleware))
        .with_state(state)
}

/// List all wallets for a user
pub async fn list_wallets(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<WalletResponse>>, AppError> {
    // TODO: Extract user ID from JWT claims
    let user_id = Uuid::nil(); // Placeholder
    
    let wallets = queries::get_wallets_by_user(&state.pool, user_id)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch wallets: {}", e)))?;

    let response: Vec<WalletResponse> = wallets
        .into_iter()
        .map(|w| WalletResponse {
            id: w.id,
            name: w.name,
            chain: w.chain,
            address: w.address,
            balance: w.balance,
            created_at: w.created_at,
        })
        .collect();

    Ok(Json(response))
}

/// Create a new wallet from mnemonic
pub async fn create_wallet(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateWalletRequest>,
) -> Result<Json<WalletWithMnemonic>, AppError> {
    // TODO: Extract user ID and password from request
    let user_id = Uuid::nil(); // Placeholder
    let password = "placeholder"; // Should come from request
    
    // Generate or use provided mnemonic
    let mnemonic = if let Some(mnemonic_str) = &req.mnemonic {
        hd_wallet::validate_mnemonic(mnemonic_str)
            .map_err(|e| AppError::BadRequest(format!("Invalid mnemonic: {}", e)))?
    } else {
        hd_wallet::generate_mnemonic()
            .map_err(|e| AppError::Internal(format!("Failed to generate mnemonic: {}", e)))?
    };

    let mnemonic_phrase = mnemonic.to_string();
    let seed = hd_wallet::mnemonic_to_seed(&mnemonic, "");

    // Derive Ethereum key (BIP44: m/44'/60'/0'/0/0)
    // In production, use proper BIP32 derivation
    let eth_address = format!("0x{}", hex::encode(&seed[0..20]));
    let eth_private_key = hex::encode(&seed[0..32]);

    // Encrypt private key
    let encrypted_key = encryption::encrypt_data(&eth_private_key, password)
        .map_err(|e| AppError::Internal(format!("Failed to encrypt key: {}", e)))?;

    // Create wallet in database
    let wallet = queries::create_wallet(
        &state.pool,
        user_id,
        &req.name,
        "ethereum",
        &eth_address,
        &encrypted_key,
        hd_wallet::paths::ETHEREUM,
    )
    .await
    .map_err(|e| AppError::Internal(format!("Failed to create wallet: {}", e)))?;

    // Securely clear sensitive data
    let mut seed_vec = seed;
    encryption::secure_clear(&mut seed_vec);

    Ok(Json(WalletWithMnemonic {
        wallet: WalletResponse {
            id: wallet.id,
            name: wallet.name,
            chain: wallet.chain,
            address: wallet.address,
            balance: wallet.balance,
            created_at: wallet.created_at,
        },
        mnemonic: mnemonic_phrase,
    }))
}

/// Import wallet from existing mnemonic
pub async fn import_wallet(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ImportWalletRequest>,
) -> Result<Json<WalletResponse>, AppError> {
    // TODO: Extract user ID and password from request
    let user_id = Uuid::nil(); // Placeholder
    let password = "placeholder"; // Should come from request

    // Validate mnemonic
    let mnemonic = hd_wallet::validate_mnemonic(&req.mnemonic)
        .map_err(|e| AppError::BadRequest(format!("Invalid mnemonic: {}", e)))?;

    let seed = hd_wallet::mnemonic_to_seed(&mnemonic, "");

    // Derive Ethereum address
    let eth_address = format!("0x{}", hex::encode(&seed[0..20]));
    let eth_private_key = hex::encode(&seed[0..32]);

    // Encrypt private key
    let encrypted_key = encryption::encrypt_data(&eth_private_key, password)
        .map_err(|e| AppError::Internal(format!("Failed to encrypt key: {}", e)))?;

    // Create wallet in database
    let wallet = queries::create_wallet(
        &state.pool,
        user_id,
        &req.name,
        "ethereum",
        &eth_address,
        &encrypted_key,
        hd_wallet::paths::ETHEREUM,
    )
    .await
    .map_err(|e| AppError::Internal(format!("Failed to create wallet: {}", e)))?;

    // Securely clear sensitive data
    let mut seed_vec = seed;
    encryption::secure_clear(&mut seed_vec);

    Ok(Json(WalletResponse {
        id: wallet.id,
        name: wallet.name,
        chain: wallet.chain,
        address: wallet.address,
        balance: wallet.balance,
        created_at: wallet.created_at,
    }))
}

/// Get wallet balance
pub async fn get_balance(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(wallet_id): axum::extract::Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let wallet = queries::get_wallet_by_id(&state.pool, wallet_id)
        .await
        .map_err(|e| AppError::NotFound(format!("Wallet not found: {}", e)))?;

    // TODO: Fetch actual balance from blockchain
    // For now, return stored balance
    Ok(Json(serde_json::json!({
        "wallet_id": wallet.id,
        "balance": wallet.balance,
        "chain": wallet.chain,
    })))
}
