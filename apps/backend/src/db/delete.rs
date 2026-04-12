use sqlx::PgPool;
use uuid::Uuid;

/// Delete wallet by ID (ensures it belongs to the user)
pub async fn delete_wallet(
    pool: &PgPool,
    wallet_id: Uuid,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query!(
        r#"
        DELETE FROM wallets
        WHERE id = $1 AND user_id = $2
        "#,
        wallet_id,
        user_id
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
