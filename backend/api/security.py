import hashlib
import hmac
import secrets


PASSWORD_HASH_PREFIX = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 310_000


def hash_password(password):
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_HASH_ITERATIONS
    )
    return f"{PASSWORD_HASH_PREFIX}${PASSWORD_HASH_ITERATIONS}${salt.hex()}${digest.hex()}"


def is_password_hash(value):
    return isinstance(value, str) and value.startswith(f"{PASSWORD_HASH_PREFIX}$")


def verify_password(password, stored_value):
    if not is_password_hash(stored_value):
        return hmac.compare_digest(password, stored_value or "")

    try:
        prefix, iterations, salt_hex, digest_hex = stored_value.split("$", 3)
        if prefix != PASSWORD_HASH_PREFIX:
            return False
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(actual, expected)
