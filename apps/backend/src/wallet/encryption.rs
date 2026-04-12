use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm,
};
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use rand::RngCore;

/// Encrypt data using AES-256-GCM
/// Key is derived from password using Argon2id
///
/// Storage format (base64-encoded): [salt_16bytes | nonce_12bytes | ciphertext]
pub fn encrypt_data(plaintext: &str, password: &str) -> Result<String, String> {
    // Generate a random 16-byte salt
    let mut salt_bytes = [0u8; 16];
    OsRng.fill_bytes(&mut salt_bytes);

    let salt = SaltString::encode_b64(&salt_bytes)
        .map_err(|e| format!("Failed to encode salt: {}", e))?;

    let argon2 = Argon2::default();

    // Hash the password with Argon2id using our salt
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("Failed to derive key: {}", e))?;

    // Extract the raw hash output (32 bytes) as our AES key
    // password_hash.hash contains the actual derived key bytes
    let hash_output = password_hash
        .hash
        .ok_or_else(|| "Failed to extract hash bytes".to_string())?;
    let hash_bytes: &[u8] = hash_output.as_bytes();

    let mut key = [0u8; 32];
    key.copy_from_slice(hash_bytes);

    let cipher = Aes256Gcm::new(&key.into());
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Combine: [salt_16 | nonce_12 | ciphertext]
    let mut combined = Vec::with_capacity(16 + 12 + ciphertext.len());
    combined.extend_from_slice(&salt_bytes);
    combined.extend_from_slice(nonce.as_slice());
    combined.extend_from_slice(&ciphertext);

    Ok(STANDARD.encode(&combined))
}

/// Decrypt data using AES-256-GCM
///
/// Expected format (base64-encoded): [salt_16bytes | nonce_12bytes | ciphertext]
pub fn decrypt_data(encrypted: &str, password: &str) -> Result<String, String> {
    let combined = STANDARD
        .decode(encrypted)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    if combined.len() < 28 {
        return Err("Encrypted data too short".to_string());
    }

    // Extract salt (first 16 bytes) and re-encode as SaltString-compatible format
    let salt_bytes: [u8; 16] = combined[..16].try_into()
        .map_err(|_| "Invalid salt length".to_string())?;

    // Reconstruct the SaltString from raw bytes using encode_b64
    let salt = SaltString::encode_b64(&salt_bytes)
        .map_err(|e| format!("Failed to encode salt: {}", e))?;

    // Extract nonce (next 12 bytes)
    let nonce_bytes = &combined[16..28];
    let nonce = aes_gcm::Nonce::from_slice(nonce_bytes);

    // Extract ciphertext (remaining bytes)
    let ciphertext = &combined[28..];

    // Derive the same key using the same salt
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("Failed to derive key: {}", e))?;

    let hash_output = password_hash
        .hash
        .ok_or_else(|| "Failed to extract hash bytes".to_string())?;
    let hash_bytes: &[u8] = hash_output.as_bytes();

    let mut key = [0u8; 32];
    key.copy_from_slice(hash_bytes);

    let cipher = Aes256Gcm::new(&key.into());
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))?;

    String::from_utf8(plaintext).map_err(|e| format!("Invalid UTF-8: {}", e))
}

/// Securely clear sensitive data from memory
pub fn secure_clear(data: &mut [u8]) {
    use zeroize::Zeroize;
    data.zeroize();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let plaintext = "test-private-key-data";
        let password = "secure-password-123";

        let encrypted = encrypt_data(plaintext, password).unwrap();
        let decrypted = decrypt_data(&encrypted, password).unwrap();

        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_wrong_password_fails() {
        let plaintext = "test-private-key-data";
        let password = "correct-password";
        let wrong_password = "wrong-password";

        let encrypted = encrypt_data(plaintext, password).unwrap();
        let result = decrypt_data(&encrypted, wrong_password);

        assert!(result.is_err());
    }

    #[test]
    fn test_different_passwords_different_ciphertext() {
        let plaintext = "test-private-key-data";
        let pw1 = "password-one";
        let pw2 = "password-two";

        let enc1 = encrypt_data(plaintext, pw1).unwrap();
        let enc2 = encrypt_data(plaintext, pw2).unwrap();

        assert_ne!(enc1, enc2);
    }
}
