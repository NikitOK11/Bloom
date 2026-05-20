import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider";
import { ApiError } from "../../shared/api/client";
import { eventsApi, type EventListItem } from "../../shared/api/events";
import { teamsApi } from "../../shared/api/teams";
import { PageLayout } from "../../shared/ui/PageLayout";

type TeamCreateState = {
    event_id: string;
    name: string;
    description: string;
    is_open: boolean;
};

const defaultFormState: TeamCreateState = {
    event_id: "",
    name: "",
    description: "",
    is_open: true,
};

function readCreateErrors(error: unknown) {
    if (error instanceof ApiError && error.data && typeof error.data === "object") {
        return error.data as Record<string, unknown>;
    }
    return {};
}

export function TeamCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, isLoading } = useAuth();
    const [teamCapableEvents, setTeamCapableEvents] = useState<EventListItem[]>([]);
    const [pageState, setPageState] = useState<"loading" | "ready" | "error">("loading");
    const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
    const [formState, setFormState] = useState<TeamCreateState>(defaultFormState);
    const [generalError, setGeneralError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadEvents = async () => {
            setPageState("loading");
            try {
                const events = await eventsApi.list({ isActive: true });
                if (!isMounted) {
                    return;
                }
                const filteredEvents = events.filter(
                    (event) => event.participation_mode === "team" || event.participation_mode === "hybrid",
                );
                setTeamCapableEvents(filteredEvents);
                setPageState("ready");
            } catch {
                if (!isMounted) {
                    return;
                }
                setPageState("error");
            }
        };

        void loadEvents();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const eventId = searchParams.get("eventId");
        if (!eventId) {
            return;
        }
        setFormState((current) => ({ ...current, event_id: eventId }));
    }, [searchParams]);

    const hasAvailableEvents = useMemo(() => teamCapableEvents.length > 0, [teamCapableEvents]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setGeneralError(null);
        setSubmitState("submitting");

        try {
            const team = await teamsApi.create({
                event_id: Number(formState.event_id),
                name: formState.name,
                description: formState.description,
                is_open: formState.is_open,
            });
            navigate(`/teams/${team.id}`, { replace: true });
        } catch (error) {
            const errors = readCreateErrors(error);
            if ("non_field_errors" in errors && Array.isArray(errors.non_field_errors)) {
                setGeneralError(String(errors.non_field_errors[0]));
            } else if ("event_id" in errors && Array.isArray(errors.event_id)) {
                setGeneralError(String(errors.event_id[0]));
            } else if ("name" in errors && Array.isArray(errors.name)) {
                setGeneralError(String(errors.name[0]));
            } else {
                setGeneralError("Не удалось создать команду. Проверьте данные формы.");
            }
        } finally {
            setSubmitState("idle");
        }
    };

    return (
        <PageLayout
            title="Новая команда"
            description="Создайте команду для события с командным или смешанным форматом участия."
        >
            {!isLoading && !isAuthenticated && (
                <section className="card auth-card">
                    <h2>Нужен вход в аккаунт</h2>
                    <p>Чтобы создать команду, сначала войдите в Bloom.</p>
                    <div className="action-row">
                        <Link className="button" to="/login">
                            Войти
                        </Link>
                    </div>
                </section>
            )}

            {isLoading && (
                <section className="card auth-card">
                    <p>Проверяем сессию...</p>
                </section>
            )}

            {!isLoading && isAuthenticated && pageState === "loading" && (
                <section className="card auth-card">
                    <p>Загружаем события для создания команды...</p>
                </section>
            )}

            {!isLoading && isAuthenticated && pageState === "error" && (
                <section className="card auth-card">
                    <h2>Не удалось загрузить форму</h2>
                    <p>Список событий для команды временно недоступен.</p>
                </section>
            )}

            {!isLoading && isAuthenticated && pageState === "ready" && !hasAvailableEvents && (
                <section className="card auth-card">
                    <h2>Подходящих событий пока нет</h2>
                    <p>Сейчас нет активных событий, для которых можно создать команду.</p>
                </section>
            )}

            {!isLoading && isAuthenticated && pageState === "ready" && hasAvailableEvents && (
                <section className="card auth-card">
                    <h2>Создать команду</h2>
                    <form className="form-grid" onSubmit={handleSubmit}>
                        <label className="form-field">
                            <span className="form-label">Событие</span>
                            <select
                                className="form-input"
                                value={formState.event_id}
                                onChange={(event) =>
                                    setFormState((current) => ({
                                        ...current,
                                        event_id: event.target.value,
                                    }))
                                }
                                required
                            >
                                <option value="">Выберите событие</option>
                                {teamCapableEvents.map((eventItem) => (
                                    <option key={eventItem.id} value={eventItem.id}>
                                        {eventItem.name || eventItem.title}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="form-field">
                            <span className="form-label">Название команды</span>
                            <input
                                className="form-input"
                                type="text"
                                value={formState.name}
                                onChange={(event) =>
                                    setFormState((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                required
                            />
                        </label>

                        <label className="form-field">
                            <span className="form-label">Описание</span>
                            <textarea
                                className="form-input form-textarea"
                                value={formState.description}
                                onChange={(event) =>
                                    setFormState((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                rows={5}
                                placeholder="Расскажите, кого ищет команда и чем планирует заниматься"
                            />
                        </label>

                        <label className="checkbox-field">
                            <input
                                type="checkbox"
                                checked={formState.is_open}
                                onChange={(event) =>
                                    setFormState((current) => ({
                                        ...current,
                                        is_open: event.target.checked,
                                    }))
                                }
                            />
                            <span>Команда открыта для новых заявок</span>
                        </label>

                        {generalError && <p className="form-error form-error-block">{generalError}</p>}

                        <div className="action-row">
                            <button className="button" type="submit" disabled={submitState === "submitting"}>
                                {submitState === "submitting" ? "Создаём команду..." : "Создать команду"}
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </PageLayout>
    );
}
