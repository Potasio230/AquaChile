import tempfile
import unittest
from pathlib import Path

from backend.api import database
from backend.api.repository import SQLiteRepository
from backend.api.security import hash_password, is_password_hash, verify_password


class PasswordSecurityTests(unittest.TestCase):
    def test_hash_verifies_password_without_storing_plaintext(self):
        stored = hash_password("correct horse battery staple")

        self.assertTrue(is_password_hash(stored))
        self.assertNotEqual(stored, "correct horse battery staple")
        self.assertTrue(verify_password("correct horse battery staple", stored))
        self.assertFalse(verify_password("wrong password", stored))

    def test_legacy_plaintext_password_is_upgraded_on_successful_login(self):
        original_path = database.DB_PATH
        with tempfile.TemporaryDirectory() as temp_directory:
            database.DB_PATH = Path(temp_directory) / "test.db"
            try:
                repository = SQLiteRepository()
                repository.initialize()
                with database.connect() as connection:
                    connection.execute(
                        "INSERT INTO usuario (nombre, email, rol, clave) VALUES (?, ?, ?, ?)",
                        ("Legacy User", "legacy@example.test", "ANALISTA", "legacy-password"),
                    )
                    connection.commit()

                self.assertIsNotNone(repository.authenticate("legacy@example.test", "legacy-password"))
                with database.connect() as connection:
                    stored = connection.execute(
                        "SELECT clave FROM usuario WHERE email = ?", ("legacy@example.test",)
                    ).fetchone()["clave"]
                self.assertTrue(is_password_hash(stored))
                self.assertTrue(verify_password("legacy-password", stored))
            finally:
                database.DB_PATH = original_path


if __name__ == "__main__":
    unittest.main()
