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
