#!/bin/sh
set -e

python - <<'PY'
import os
import socket
import time
from urllib.parse import urlparse

database_url = os.environ.get("DATABASE_URL", "")
parsed = urlparse(database_url)
host = parsed.hostname
port = parsed.port or 5432

if host:
    for attempt in range(60):
        try:
            with socket.create_connection((host, port), timeout=2):
                break
        except OSError:
            if attempt == 59:
                raise
            time.sleep(1)
PY

python manage.py migrate

exec "$@"
