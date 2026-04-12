// Result type aliases for the application

pub type AppResult<T> = Result<T, crate::error::app_error::AppError>;
