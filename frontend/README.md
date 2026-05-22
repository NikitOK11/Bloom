# Bloom frontend

`frontend/` is the production user-facing application for Bloom, built with React + Vite + TypeScript.

Bloom now uses a split architecture:

- `frontend/` serves the normal user-facing UI as a client-side rendered React app;
- `backend/` serves the Django API under `/api/` and Django admin under `/admin/`;
- the old Django template-based `backend/apps/web/` UI has been removed from the active architecture.

## Current capabilities

- routes for `/`, `/events`, `/events/:eventId`, `/olympiads`, `/login`, `/signup`, `/profile`, `/teams/new`, and `/teams/:teamId`;
- shared API client in `src/shared/api/client.ts`;
- session-based auth via the Django accounts API;
- Event catalog, Event detail, profile, and team flows powered by the Django API;
- global styling and bundled frontend assets inside `frontend/`.

## Install dependencies

```bash
cd frontend
npm install
```

## Run the dev server

```bash
cd frontend
npm run dev
```

## Production build

```bash
cd frontend
npm run build
```

## API connection

The frontend uses:

```bash
VITE_API_BASE_URL=/api
```

See:

```bash
frontend/.env.example
```

By default, requests go to `/api` and the shared client:

- builds URLs relative to `VITE_API_BASE_URL`;
- sends `credentials: "include"`;
- bootstraps a CSRF cookie from `/api/accounts/csrf/` before unsafe requests;
- handles JSON and empty responses safely;
- throws useful errors for non-OK responses.

Bloom is expected to run behind one public origin in the production-style setup, so the React app talks to Django through the same host and path split. That means no separate CORS layer is required for the normal Docker/nginx flow.

In local Vite development, `/api` is proxied to:

```bash
VITE_DEV_API_PROXY_TARGET=http://127.0.0.1:8080
```

This makes `npm run dev` work against the Docker stack without rewriting API calls.

If Django runs on a separate origin in development, point the variable to the full API base URL, for example:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

## Production routing scaffold

The repository includes a minimal Nginx scaffold for production-like routing:

- `frontend/Dockerfile` builds the React app and produces the internal `frontend` static service;
- `frontend/deploy/nginx/frontend.conf` makes the internal frontend service serve the React build with SPA fallback;
- `deploy/nginx/default.conf` is the reverse-proxy entrypoint that sends `/api/` and `/admin/` to Django and all other paths to the frontend service;
- React Router keeps working after refresh on routes like `/events/1`, `/profile`, and `/teams/1`.

Example:

```bash
docker compose up --build
```

After that:

- `http://localhost:8080/api/` goes to the Django API;
- `http://localhost:8080/admin/` goes to Django admin;
- normal user-facing URLs go to the React frontend.
