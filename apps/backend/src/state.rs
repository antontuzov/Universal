use sqlx::PgPool;
use fred::prelude::*;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub redis: Arc<RedisClient>,
}

impl AppState {
    pub fn new(pool: PgPool, redis: RedisClient) -> Self {
        Self {
            pool,
            redis: Arc::new(redis),
        }
    }
}
