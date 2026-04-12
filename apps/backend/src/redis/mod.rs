use fred::prelude::*;
use tracing;

/// Blacklist a token (for logout/revocation)
/// TTL should match the token's original expiration
pub async fn blacklist_token(redis: &RedisClient, token: &str, ttl_seconds: i64) -> Result<(), String> {
    let key = format!("blacklisted_token:{}", token);
    redis
        .set(key, "1", Some(Expiration::EX(ttl_seconds)), None, false)
        .await
        .map_err(|e| format!("Failed to blacklist token: {}", e))
}

/// Check if a token is blacklisted
pub async fn is_token_blacklisted(redis: &RedisClient, token: &str) -> Result<bool, String> {
    let key = format!("blacklisted_token:{}", token);
    redis
        .exists(key)
        .await
        .map(|v: i64| v > 0)
        .map_err(|e| format!("Failed to check token blacklist: {}", e))
}

/// Rate limit check — returns true if request is ALLOWED
/// Uses sliding window counter
pub async fn check_rate_limit(
    redis: &RedisClient,
    key: &str,
    max_requests: i64,
    window_seconds: i64,
) -> Result<bool, String> {
    let redis_key = format!("rate_limit:{}", key);
    let redis_key_clone = redis_key.clone();

    let count: i64 = redis
        .incr(redis_key)
        .await
        .map_err(|e| format!("Rate limit check failed: {}", e))?;

    // Set expiry on first request
    if count == 1 {
        let _: bool = redis.expire(redis_key_clone, window_seconds).await.unwrap_or(false);
    }

    Ok(count <= max_requests)
}

/// Initialize Redis client
pub async fn create_redis_client(url: &str) -> Result<RedisClient, String> {
    let config = RedisConfig::from_url(url)
        .map_err(|e| format!("Invalid Redis URL: {}", e))?;

    let client = RedisClient::new(config, None, None, Some(ReconnectPolicy::default()));

    // Connect and wait for initial connection
    let _handle = client.connect();
    client
        .wait_for_connect()
        .await
        .map_err(|e| format!("Failed to connect to Redis: {}", e))?;

    tracing::info!("✅ Connected to Redis");
    Ok(client)
}
