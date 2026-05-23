from .base import *  # noqa: F401, F403
from decouple import config

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
    }
}

CORS_ALLOWED_ORIGINS = [
    config("CORS_ALLOWED_ORIGIN", default="http://localhost:5173"),
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
