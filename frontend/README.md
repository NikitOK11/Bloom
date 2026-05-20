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

Пока что:

- `frontend/` — это новый CSR foundation;
- `backend/apps/web/` продолжает обслуживать текущие server-rendered страницы;
- перенос пользовательских экранов из Django в React будет идти постепенно в следующих PR.
