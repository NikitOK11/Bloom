# Bloom frontend

`frontend/` — это первый шаг к отдельному client-side frontend для Bloom на React + Vite + TypeScript.

На этом этапе приложение:

- создаёт отдельный CSR-каркас для пользовательских страниц;
- не удаляет и не переписывает существующий Django UI;
- подключается к текущему Django API через общий клиент;
- оставляет server-rendered шаблоны в `backend/apps/web/` рабочими и нетронутыми.

## Что уже есть

- маршруты `/`, `/events`, `/events/:eventId`, `/olympiads` и fallback 404;
- общий API-клиент в `src/shared/api/client.ts`;
- чтение `VITE_API_BASE_URL` с дефолтом `/api`;
- минимальная проверка доступности backend API на главной странице;
- базовые глобальные стили без UI-фреймворков.

## Установка зависимостей

```bash
cd frontend
npm install
```

## Запуск dev-сервера

```bash
cd frontend
npm run dev
```

## Production build

```bash
cd frontend
npm run build
```

## Production routing scaffold

Для production routing в репозитории добавлен минимальный Nginx-scaffold:

- `frontend/Dockerfile` собирает React-приложение и кладёт build в Nginx;
- `frontend/deploy/nginx/default.conf` проксирует `/api/` и `/admin/` в Django backend;
- все остальные пути отдаются из React build через `try_files ... /index.html`, поэтому refresh на маршрутах вроде `/events/1`, `/profile` и `/teams/1` не ломает React Router;
- `compose.prod.yml` показывает базовую связку `frontend` + `web` + `db` для production-подобного запуска.

Идея маршрутизации такая:

- Django продолжает обслуживать `/api/` и `/admin/`;
- React становится основным UI для обычных пользовательских URL;
- существующие Django templates и `backend/apps/web/` пока остаются в проекте и не удаляются на этом шаге, но Django больше не монтирует их как активные root/user-facing маршруты.

Пример запуска scaffolding-конфигурации:

```bash
docker compose -f compose.prod.yml up --build
```

После этого:

- `http://localhost:8080/api/` идёт в Django API;
- `http://localhost:8080/admin/` идёт в Django admin;
- `http://localhost:8080/events/1`, `http://localhost:8080/profile` и другие CSR-маршруты открываются через React.

## Подключение к Django API

Frontend использует переменную окружения:

```bash
VITE_API_BASE_URL=/api
```

Пример файла:

```bash
frontend/.env.example
```

По умолчанию запросы идут в `/api`, а клиент:

- строит URL относительно `VITE_API_BASE_URL`;
- отправляет `credentials: "include"`;
- корректно обрабатывает JSON и пустые ответы;
- выбрасывает понятную ошибку для неуспешных ответов.

Если backend запущен отдельно, можно задать полный base URL, например:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

## Важно для текущей миграции

Существующие Django templates и текущий product-facing UI специально не удаляются в этом шаге миграции.

Сейчас routing responsibility split такой:

- `frontend/` — это новый CSR foundation;
- React — единственный intended UI для обычных пользовательских страниц;
- Django обслуживает только `/api/` и `/admin/`;
- `backend/apps/web/` остаётся в репозитории как legacy-код переходного периода, но его маршруты больше не подключены в корневой Django URL config;
- перенос пользовательских экранов из Django в React будет идти постепенно в следующих PR.
