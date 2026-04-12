use sqlx::PgPool;
use uuid::Uuid;

use super::models::{User, Wallet, Transaction, AuditLog};

/// Create a new user
pub async fn create_user(
    pool: &PgPool,
    email: &str,
    password_hash: &str,
) -> Result<User, sqlx::Error> {
    sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING *
        "#,
        email,
        password_hash
    )
    .fetch_one(pool)
    .await
}

/// Get user by email
pub async fn get_user_by_email(pool: &PgPool, email: &str) -> Result<User, sqlx::Error> {
    sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users
        WHERE email = $1
        "#,
        email
    )
    .fetch_one(pool)
    .await
}

/// Get user by ID
pub async fn get_user_by_id(pool: &PgPool, id: Uuid) -> Result<User, sqlx::Error> {
    sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users
        WHERE id = $1
        "#,
        id
    )
    .fetch_one(pool)
    .await
}

/// Get all users (admin only)
pub async fn get_all_users(pool: &PgPool, limit: i64, offset: i64) -> Result<Vec<User>, sqlx::Error> {
    sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        "#,
        limit,
        offset
    )
    .fetch_all(pool)
    .await
}

/// Create a new wallet
pub async fn create_wallet(
    pool: &PgPool,
    user_id: Uuid,
    name: &str,
    chain: &str,
    address: &str,
    encrypted_private_key: &str,
    derivation_path: &str,
) -> Result<Wallet, sqlx::Error> {
    sqlx::query_as!(
        Wallet,
        r#"
        INSERT INTO wallets (user_id, name, chain, address, encrypted_private_key, derivation_path)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
        user_id,
        name,
        chain,
        address,
        encrypted_private_key,
        derivation_path
    )
    .fetch_one(pool)
    .await
}

/// Get wallets by user ID
pub async fn get_wallets_by_user(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<Wallet>, sqlx::Error> {
    sqlx::query_as!(
        Wallet,
        r#"
        SELECT * FROM wallets
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
        user_id
    )
    .fetch_all(pool)
    .await
}

/// Get wallet by ID
pub async fn get_wallet_by_id(pool: &PgPool, id: Uuid) -> Result<Wallet, sqlx::Error> {
    sqlx::query_as!(
        Wallet,
        r#"
        SELECT * FROM wallets
        WHERE id = $1
        "#,
        id
    )
    .fetch_one(pool)
    .await
}

/// Update wallet balance
pub async fn update_wallet_balance(
    pool: &PgPool,
    id: Uuid,
    balance: &str,
) -> Result<Wallet, sqlx::Error> {
    sqlx::query_as!(
        Wallet,
        r#"
        UPDATE wallets
        SET balance = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
        "#,
        id,
        balance
    )
    .fetch_one(pool)
    .await
}

/// Create a transaction record
pub async fn create_transaction(
    pool: &PgPool,
    wallet_id: Uuid,
    chain: &str,
    from_address: &str,
    to_address: &str,
    amount: &str,
    fee: &str,
    status: &str,
) -> Result<Transaction, sqlx::Error> {
    sqlx::query_as!(
        Transaction,
        r#"
        INSERT INTO transactions (wallet_id, chain, from_address, to_address, amount, fee, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#,
        wallet_id,
        chain,
        from_address,
        to_address,
        amount,
        fee,
        status
    )
    .fetch_one(pool)
    .await
}

/// Create audit log
pub async fn create_audit_log(
    pool: &PgPool,
    user_id: Option<Uuid>,
    action: &str,
    details: Option<serde_json::Value>,
    ip_address: Option<&str>,
) -> Result<AuditLog, sqlx::Error> {
    sqlx::query_as!(
        AuditLog,
        r#"
        INSERT INTO audit_logs (user_id, action, details, ip_address)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        "#,
        user_id,
        action,
        details,
        ip_address
    )
    .fetch_one(pool)
    .await
}
