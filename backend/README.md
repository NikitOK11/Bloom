# Bloom Backend (Django Scaffold)

## Local setup

1. Create virtual environment:

```bash
python -m venv .venv
```

2. Activate it:

```bash
# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create local env file and set DB:

```bash
Copy-Item .env.example .env
```

Set `DATABASE_URL` in `.env` to your PostgreSQL DSN.

5. Run migrations:

```bash
python manage.py migrate
```

6. Create superuser:

```bash
python manage.py createsuperuser
```

7. Start server:

```bash
python manage.py runserver
```

8. Health check:

- `GET http://127.0.0.1:8000/api/health/`
- Expected response: `{"status":"ok"}`

## Routing responsibility

- Django serves backend concerns only: `/api/` and `/admin/`.
- The React frontend is the only user-facing UI.
- The legacy Django `web` app has been removed from the active project architecture.

## Docker local development

From the repository root:

```bash
docker compose up --build
```

The Django app serves API and admin endpoints at `http://127.0.0.1:8000/api/` and `http://127.0.0.1:8000/admin/`.
PostgreSQL is exposed on host port `5433` by default to avoid clashing with a local PostgreSQL install.
Override it with `POSTGRES_HOST_PORT=5432 docker compose up --build` if needed.

Stop containers:

```bash
docker compose down
```

Run management commands:

```bash
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py test
```
