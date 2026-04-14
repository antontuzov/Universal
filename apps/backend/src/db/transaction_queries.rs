use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionResponse {
    pub id: Uuid,
    pub wallet_id: Uuid,
    pub chain: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: String,
    pub fee: String,
    pub status: String,
    pub tx_hash: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Get all transactions for a user's wallets
pub async fn get_user_transactions(
    pool: &sqlx::PgPool,
    user_id: Uuid,
    limit: i64,
    offset: i64,
) -> Result<Vec<TransactionResponse>, sqlx::Error> {
    sqlx::query_as!(
        TransactionResponse,
        r#"
        SELECT t.id, t.wallet_id, t.chain, t.from_address, t.to_address,
               t.amount, t.fee, t.status, t.tx_hash, t.created_at
        FROM transactions t
        INNER JOIN wallets w ON t.wallet_id = w.id
        WHERE w.user_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        user_id,
        limit,
        offset
    )
    .fetch_all(pool)
    .await
}

/// Get transaction count for a user
pub async fn get_user_transaction_count(
    pool: &sqlx::PgPool,
    user_id: Uuid,
) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)
        FROM transactions t
        INNER JOIN wallets w ON t.wallet_id = w.id
        WHERE w.user_id = $1
        "#
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(row.0)
}
