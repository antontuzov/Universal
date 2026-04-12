use bip39::Mnemonic;
use rand::thread_rng;
use zeroize::Zeroize;

/// Generate a new BIP39 mnemonic phrase (24 words = 256 bits of entropy)
pub fn generate_mnemonic() -> Result<Mnemonic, Box<dyn std::error::Error>> {
    let mut rng = thread_rng();
    let mnemonic = Mnemonic::generate_in_with(&mut rng, bip39::Language::English, 24)?;
    Ok(mnemonic)
}

/// Validate a mnemonic phrase
pub fn validate_mnemonic(mnemonic_str: &str) -> Result<Mnemonic, Box<dyn std::error::Error>> {
    let mnemonic = Mnemonic::parse(mnemonic_str)?;
    // bip39 v2 validates on parse, so if we got here, it's valid
    Ok(mnemonic)
}

/// Derive seed from mnemonic (with optional passphrase)
pub fn mnemonic_to_seed(mnemonic: &Mnemonic, passphrase: &str) -> Vec<u8> {
    mnemonic.to_seed(passphrase).to_vec()
}

/// BIP44 derivation paths for different chains
pub mod paths {
    pub const ETHEREUM: &str = "m/44'/60'/0'/0/0";
    pub const BITCOIN: &str = "m/44'/0'/0'/0/0";
    pub const SOLANA: &str = "m/44'/501'/0'/0'";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_mnemonic() {
        let mnemonic = generate_mnemonic().unwrap();
        let phrase = mnemonic.to_string();

        // Should be 24 words
        assert_eq!(phrase.split_whitespace().count(), 24);

        // bip39 v2 validates on parse, so re-parsing validates it
        let _parsed = validate_mnemonic(&phrase).unwrap();
    }

    #[test]
    fn test_invalid_mnemonic() {
        let result = validate_mnemonic("invalid words here");
        assert!(result.is_err());
    }

    #[test]
    fn test_seed_derivation() {
        let mnemonic = generate_mnemonic().unwrap();
        let seed = mnemonic_to_seed(&mnemonic, "");
        
        // Seed should be 64 bytes
        assert_eq!(seed.len(), 64);
    }
}
