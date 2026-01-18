"""Cryptography helpers for sensitive data encryption."""

from __future__ import annotations

import os
import base64
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)

# In production, this should be a 32-byte base64 encoded string from Secret Manager
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")

def _get_fernet() -> Fernet | None:
    if not ENCRYPTION_KEY:
        logger.warning("ENCRYPTION_KEY not set. Data will be stored in plain text (NOT RECOMMENDED).")
        return None
    try:
        return Fernet(ENCRYPTION_KEY.encode())
    except Exception as exc:
        logger.error("Invalid ENCRYPTION_KEY format: %s", exc)
        return None

def encrypt_string(plain_text: str | None) -> str | None:
    if plain_text is None:
        return None
    
    fernet = _get_fernet()
    if not fernet:
        return plain_text
        
    try:
        return fernet.encrypt(plain_text.encode()).decode()
    except Exception as exc:
        logger.error("Encryption failed: %s", exc)
        return plain_text

def decrypt_string(cipher_text: str | None) -> str | None:
    if cipher_text is None:
        return None
        
    fernet = _get_fernet()
    if not fernet:
        return cipher_text
        
    try:
        return fernet.decrypt(cipher_text.encode()).decode()
    except Exception as exc:
        # If decryption fails, it might be because the text was not encrypted (migration phase)
        # or the key is wrong.
        logger.debug("Decryption failed (might be plain text): %s", exc)
        return cipher_text

def generate_key() -> str:
    """Utility to generate a new encryption key."""
    return Fernet.generate_key().decode()
