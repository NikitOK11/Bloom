# CODEX.md

## 1) Короткое описание проекта
- Проект: backend-only платформа на Django для рынка РФ/СНГ, без фронтенда в текущем репозитории.
- Продуктовое ядро: каталог событий для удобного поиска и выбора.
- Event — новая центральная доменная сущность; событие может быть олимпиадой, хакатоном или кейс-чемпионатом.
- Поиск команды — отдельный пользовательский путь только для событий с командным или смешанным участием.
- Локальные/приватные соревнования сейчас не являются активным фокусом MVP, хотя существующий код нельзя ломать.
- `Event` — единственная каноническая сущность для всех событий; `Team.event` — единственная связь команды с событием.

## 2) Текущий tech stack
- Ядро: Django + Django REST Framework.
- База данных: PostgreSQL, подключение через `DATABASE_URL`.
- Конфигурация окружения: `django-environ`.
- Зависимости проекта: `backend/requirements.txt`.
- Шаблон переменных окружения: `backend/.env.example`.
- Локальный запуск поддерживается двумя путями: обычный Python/venv и Docker Compose для Django + PostgreSQL.

## 3) Навигация по структуре проекта

### Корневая структура backend
- `backend/manage.py` — точка входа Django-команд.
- `backend/config/` — проектная конфигурация:
  - `settings.py` — базовые настройки, env, DB, приложения.
  - `urls.py` — глобальные маршруты (`admin/`, `api/`).
  - `asgi.py`, `wsgi.py` — entrypoints для ASGI/WSGI.
- `backend/apps/` — доменные приложения:
  - `common/` — общий каркас и переиспользуемые элементы.
  - `accounts/` — пользователи и аутентификация:
    - `models.py` — минимальный `CustomUser` (`email` как `USERNAME_FIELD`, `phone` nullable).
    - `admin.py` — регистрация модели в админке.
  - `events/` — каталог событий и справочники для нового event-centric домена.
  - `teams/` — каркас модуля команд.
  - `competitions/` — каркас модуля соревнований.
- `backend/api/` — API-слой:
  - `urls.py` — маршруты API (сейчас только health).
  - `views.py` — `HealthCheckAPIView` (`GET {"status":"ok"}`).
- `backend/requirements.txt` — список Python-зависимостей.
- `backend/.env.example` — пример `.env`.
- `backend/README.md` — краткая инструкция запуска.

### Как расширять дальше (правило)
- Для новой фичи в конкретном app использовать последовательность:
  - `models.py` (данные и ограничения),
  - `serializers.py` (валидация и API-представление),
  - `views.py` (endpoint-логика),
  - `urls.py` (локальные маршруты app/api),
  - `services/` (вынос бизнес-логики при росте сложности).
- Сохранять app-based структуру: доменная логика живет внутри своего приложения, а не в `config`.

## 4) Правила для будущих PR от Codex
- Делать маленькие PR: один шаг, одна фича, один понятный инкремент.
- Не менять структуру папок без необходимости.
- При неоднозначности задавать вопросы до начала код-изменений.
- Каждый завершенный PR-sized change сразу коммитить и пушить в `origin main`.
- Пока все изменения выполняются напрямую в ветке `main`.

## 5) Локальный запуск (все команды из `backend/`)
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# заполнить DATABASE_URL в .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Docker local development (из корня репозитория)
```bash
docker compose up --build
```
- Docker — поддерживаемый локальный путь запуска вместе с non-Docker flow.
- PR-sized изменения по-прежнему сразу коммитить и пушить в `origin main`.

## 6) Команды проверок (минимум)
```bash
cd backend
python manage.py check
python manage.py test
```
- `python manage.py test` используется по мере появления тестов.

## 7) Политика миграций и PostgreSQL
- Любое изменение моделей должно сопровождаться миграциями.
- Проект ориентирован на PostgreSQL; не писать код, завязанный на SQLite-специфику.
- Уникальности, ограничения и индексы задавать через модели и миграции, а не только через runtime-проверки.

## 8) Security baseline (нельзя ломать)
- Приватные соревнования должны быть доступны только владельцу и участникам.
- Контакты профиля должны поддерживать visibility-режимы:
  - `PUBLIC`
  - `ONLY_TEAM`
  - `HIDDEN`
- Visibility для контактов пока не реализован, но считается обязательным требованием для будущих изменений.

## 9) API conventions на будущее
- Использовать DRF для API-слоя.
- Валидацию входных/выходных данных делать через сериализаторы.
- На каждом endpoint задавать явные permissions.
- Поддерживать единый нейминг и маршрутизацию через `backend/api/`.

## 10) Domain baseline
- Архитектура event-centric: `Event`/Событие — единственная каноническая сущность каталога; типы событий включают олимпиады, хакатоны и кейс-чемпионаты.
- Legacy olympiad model/app полностью удален из проекта; новые product-facing данные создавать только через `Event`/Событие.
- `Event`/Событие — основная модель чтения для пользовательских страниц и редактирования в админке.
- Активное UI-направление: light + deep green academic landing, Russian-first UX, event-first каталог; в product-facing UI не добавлять ссылки на админку; визуальные PR оставлять маленькими и пушить напрямую в `origin main`.
- Product-facing web использует Django templates с vanilla JS partial navigation как progressive enhancement; обычные Django routes должны оставаться рабочими без JavaScript.
- Product-facing UI — Russian-first; English поддерживается как вторичный язык, а переключение языка должно быть простым и быстрым.
- Event schema находится в переходной фазе: старые richer fields пока остаются, а новые canonical scalar fields добавляются как мост к финальной DB-схеме.
- Product-facing код теперь считает canonical scalar fields (`name`, `event_type_code`, `profile_code`, `level_code`, `participation_mode`, `official_url`) основным источником; legacy Event fields остаются только для совместимости во время миграции.
- `EventEdition` описывает конкретный сезон/цикл `Event`/События; `EventEditionStage` описывает этап внутри одного сезона/цикла.
- Новое создание команд должно идти от `Event`; страницы событий — основной экран просмотра команд.
- `Team.event` — единственная допустимая связь команды с `Event`/Событием.
- Новый product-facing код должен использовать `Event` и `Team.event`.
- JoinRequest — state machine: `PENDING -> APPROVED/REJECTED/WITHDRAWN`.
- `APPROVED`, `REJECTED`, `WITHDRAWN` — финальные статусы, дальнейшие переходы запрещены.

## TODO (на будущее)
- Добавить единый регламент форматирования и линтинга после явного согласования инструментов в зависимостях проекта.
