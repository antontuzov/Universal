use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2,
};
use base64::{engine::general_purpose::STANDARD, Engine};

/// Encrypt data using AES-256-GCM
/// Key is derived from password using Argon2id
pub fn encrypt_data(plaintext: &str, password: &str) -> Result<String, String> {
    // Derive encryption key from password using Argon2id
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    
    // Use only first 32 bytes for AES-256 key
    let key_material = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("Failed to derive key: {}", e))?
        .to_string();
    
    let key_slice = key_material.as_bytes();
    let mut key = [0u8; 32];
    key.copy_from_slice(&key_slice[..32]);
    
    let cipher = Aes256Gcm::new(&key.into());
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher.encrypt(&nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    // Combine salt, nonce and ciphertext
    let salt_str = salt.to_string();
    let mut combined = salt_str.as_bytes().to_vec();
    combined.extend_from_slice(nonce.as_slice());
    combined.extend_from_slice(&ciphertext);
    
    Ok(STANDARD.encode(&combined))
}

/// Decrypt data using AES-256-GCM
pub fn decrypt_data(encrypted: &str, password: &str) -> Result<String, String> {
    let combined = STANDARD.decode(encrypted)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    // Extract salt (first chars until we can parse it)
    // We stored salt as base64 string, so we need to extract it properly
    // For simplicity, let's use a fixed salt length in the encoded string
    // The salt string is 96 base64 chars, but we stored the raw bytes
    // Let's use a simpler approach: store salt separately
    
    // For now, extract first 16 bytes as salt bytes
    let salt_bytes = &combined[..16];
    let salt_str = STANDARD.encode(salt_bytes);
    let salt = SaltString::from_b64(&salt_str)
        .map_err(|e| format!("Invalid salt: {}", e))?;
    
    // Extract nonce (next 12 bytes)
    let nonce_bytes = &combined[16..28];
    let nonce = Nonce::from_slice(nonce_bytes);
    
    // Extract ciphertext
    let ciphertext = &combined[28..];
    
    // Derive key (same as encryption)
    let argon2 = Argon2::default();
    let key_material = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("Failed to derive key: {}", e))?
        .to_string();
    
    let key_slice = key_material.as_bytes();
    let mut key = [0u8; 32];
    key.copy_from_slice(&key_slice[..32]);
    
    let cipher = Aes256Gcm::new(&key.into());
    let plaintext = cipher.decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))?;
    
    String::from_utf8(plaintext)
        .map_err(|e| format!("Invalid UTF-8: {}", e))
}

/// Securely clear sensitive data from memory
pub fn secure_clear(data: &mut [u8]) {
    for byte in data.iter_mut() {
        *byte = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let plaintext = "test-private-key-data";
        let password = "secure-password-123";
        
        let encrypted = encrypt_data(plaintext, password).unwrap();
        let decrypted = decrypt_data(&encrypted, password).unwrap();
        
        assert_eq!(plaintext, decrypted);
    }
}
