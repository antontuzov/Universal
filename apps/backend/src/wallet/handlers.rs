use axum::{
    extract::{State, Extension},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::state::AppState;
use crate::error::app_error::AppError;
use crate::db::queries;
use crate::db::delete;
use crate::auth::Claims;

use super::types::*;
use super::hd_wallet;
use super::encryption;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/", get(list_wallets))
        .route("/create", post(create_wallet))
        .route("/import", post(import_wallet))
        .route("/import-key", post(import_private_key))
        .route("/estimate-fee", post(estimate_fee))
        .route("/get-nonce", post(get_nonce))
        .route("/rename", post(rename_wallet))
        .route("/export", post(export_wallet))
        .route("/:id", post(delete_wallet_handler))
        .route("/:id/balance", get(get_balance))
        .with_state(state)
}

/// List all wallets for the authenticated user
pub async fn list_wallets(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<WalletResponse>>, AppError> {
    let wallets = queries::get_wallets_by_user(&state.pool, claims.sub)
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
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateWalletRequest>,
) -> Result<Json<WalletWithMnemonic>, AppError> {
    let user_id = claims.sub;
    let password = &req.password;

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

    // Derive Ethereum address and private key from seed
    // NOTE: This is a simplified derivation. In production, use a proper BIP32 library
    // like bip32 crate to derive the extended private key, then the child key at the
    // BIP44 path, then extract the private key bytes.
    let eth_address = format!("0x{}", hex::encode(&seed[0..20]));
    let eth_private_key = hex::encode(&seed[0..32]);

    // Encrypt private key with user's password
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

    // Securely clear sensitive data from memory
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
    Extension(claims): Extension<Claims>,
    Json(req): Json<ImportWalletRequest>,
) -> Result<Json<WalletResponse>, AppError> {
    let user_id = claims.sub;
    let password = &req.password;

    // Validate mnemonic
    let mnemonic = hd_wallet::validate_mnemonic(&req.mnemonic)
        .map_err(|e| AppError::BadRequest(format!("Invalid mnemonic: {}", e)))?;

    let seed = hd_wallet::mnemonic_to_seed(&mnemonic, "");

    // Derive Ethereum address and private key from seed
    let eth_address = format!("0x{}", hex::encode(&seed[0..20]));
    let eth_private_key = hex::encode(&seed[0..32]);

    // Encrypt private key with user's password
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

    // Securely clear sensitive data from memory
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
    Extension(_claims): Extension<Claims>,
    axum::extract::Path(wallet_id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let wallet = queries::get_wallet_by_id(&state.pool, wallet_id)
        .await
        .map_err(|e| AppError::NotFound(format!("Wallet not found: {}", e)))?;

    Ok(Json(serde_json::json!({
        "wallet_id": wallet.id,
        "balance": wallet.balance,
        "chain": wallet.chain,
    })))
}

/// Delete a wallet
pub async fn delete_wallet_handler(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    axum::extract::Path(wallet_id): axum::extract::Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let deleted = delete::delete_wallet(&state.pool, wallet_id, claims.sub)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to delete wallet: {}", e)))?;

    if !deleted {
        return Err(AppError::NotFound("Wallet not found or not owned by user".to_string()));
    }

    Ok(Json(serde_json::json!({ "message": "Wallet deleted successfully" })))
}

/// Rename a wallet
pub async fn rename_wallet(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<RenameWalletRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query(
        "UPDATE wallets SET name = $3, updated_at = NOW() WHERE id = $1 AND user_id = $2"
    )
    .bind(req.wallet_id)
    .bind(claims.sub)
    .bind(&req.name)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Failed to rename wallet: {}", e)))?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Wallet not found or not owned by user".to_string()));
    }

    Ok(Json(serde_json::json!({ "message": "Wallet renamed successfully" })))
}

/// Export wallet data (returns address, chain, and mnemonic placeholder — NOT private key)
pub async fn export_wallet(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<ExportWalletRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let wallet = queries::get_wallet_by_id(&state.pool, req.wallet_id)
        .await
        .map_err(|e| AppError::NotFound(format!("Wallet not found: {}", e)))?;

    if wallet.user_id != claims.sub {
        return Err(AppError::Forbidden("You do not own this wallet".to_string()));
    }

    Ok(Json(serde_json::json!({
        "wallet": {
            "id": wallet.id,
            "name": wallet.name,
            "chain": wallet.chain,
            "address": wallet.address,
            "derivationPath": wallet.derivation_path,
            "createdAt": wallet.created_at,
            "exportedAt": chrono::Utc::now(),
            "warning": "Keep this file secure. Do not share with anyone."
        }
    })))
}

/// Import wallet from raw private key
pub async fn import_private_key(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<ImportPrivateKeyRequest>,
) -> Result<Json<WalletResponse>, AppError> {
    let user_id = claims.sub;
    let password = &req.password;

    // Validate private key format (basic hex check for ETH)
    if req.chain == "ethereum" && !req.private_key.starts_with("0x") {
        return Err(AppError::BadRequest("Ethereum private key must start with 0x".to_string()));
    }

    // Derive address from private key (simplified — proper derivation needed for production)
    let address = if req.chain == "ethereum" {
        // Remove 0x prefix, take last 40 chars as address
        let key = req.private_key.strip_prefix("0x").unwrap_or(&req.private_key);
        format!("0x{}", &key[key.len().saturating_sub(40)..])
    } else {
        format!("unknown_{}", &req.private_key[..8])
    };

    // Encrypt private key with user's password
    let encrypted_key = encryption::encrypt_data(&req.private_key, password)
        .map_err(|e| AppError::Internal(format!("Failed to encrypt key: {}", e)))?;

    let derivation_path = match req.chain.as_str() {
        "ethereum" => hd_wallet::paths::ETHEREUM,
        "bitcoin" => hd_wallet::paths::BITCOIN,
        "solana" => hd_wallet::paths::SOLANA,
        _ => "m/44'/0'/0'/0/0",
    };

    let wallet = queries::create_wallet(
        &state.pool,
        user_id,
        &req.name,
        &req.chain,
        &address,
        &encrypted_key,
        derivation_path,
    )
    .await
    .map_err(|e| AppError::Internal(format!("Failed to create wallet: {}", e)))?;

    Ok(Json(WalletResponse {
        id: wallet.id,
        name: wallet.name,
        chain: wallet.chain,
        address: wallet.address,
        balance: wallet.balance,
        created_at: wallet.created_at,
    }))
}

/// Estimate transaction fee (stub — will use real blockchain RPC in production)
pub async fn estimate_fee(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<EstimateFeeRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let estimated_fee = match req.chain.as_str() {
        "ethereum" => "0.001",
        "bitcoin" => "0.00002",
        "solana" => "0.000005",
        _ => "0.001",
    };

    Ok(Json(serde_json::json!({
        "estimatedFee": estimated_fee,
        "chain": req.chain,
        "priority": req.priority.unwrap_or_else(|| "standard".to_string()),
        "note": "This is an estimate. Actual fee may vary based on network congestion."
    })))
}

/// Get current nonce for a wallet address
pub async fn get_nonce(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<GetNonceRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // TODO: Call blockchain RPC: eth_getTransactionCount for ETH
    // For now, return 0 (first transaction)
    Ok(Json(serde_json::json!({
        "address": req.address,
        "chain": req.chain,
        "nonce": 0,
        "pendingNonce": 0,
        "note": "Nonce will be fetched from blockchain RPC in production."
    })))
}

