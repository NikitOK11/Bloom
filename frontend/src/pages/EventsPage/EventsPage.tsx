import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { eventsApi, type EventListItem } from "../../shared/api/events";
import { PageLayout } from "../../shared/ui/PageLayout";

type LoadState = "loading" | "success" | "error";

export function EventsPage() {
    const [events, setEvents] = useState<EventListItem[]>([]);
    const [state, setState] = useState<LoadState>("loading");

    useEffect(() => {
        let isMounted = true;

        const loadEvents = async () => {
            setState("loading");
            try {
                const data = await eventsApi.list({ isActive: true });
                if (!isMounted) {
                    return;
                }
                setEvents(data);
                setState("success");
            } catch {
                if (!isMounted) {
                    return;
                }
                setState("error");
            }
        };

        void loadEvents();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <PageLayout
            title="События"
            description="Публичный каталог Bloom теперь загружает реальные активные события из Django API, не затрагивая текущие серверные страницы."
        >
            <section className="card">
                <div className="card-header">
                    <div>
                        <h2>Активные события</h2>
                        <p className="muted">
                            Здесь отображаются олимпиады, хакатоны и кейс-чемпионаты из
                            канонической сущности Event.
                        </p>
                    </div>
                    <span className="badge">API: /api/events/?is_active=true</span>
                </div>

                {state === "loading" && <p>Загружаем события...</p>}
                {state === "error" && (
                    <p>Не удалось загрузить события. Проверьте доступность backend API.</p>
                )}
                {state === "success" && events.length === 0 && (
                    <p>Активные события пока не найдены.</p>
                )}

                {state === "success" && events.length > 0 && (
                    <div className="event-list">
                        {events.map((event) => (
                            <article key={event.id} className="event-card">
                                <div className="event-card-header">
                                    <div>
                                        <p className="event-meta">
                                            {event.organizer || "Организатор не указан"}
                                        </p>
                                        <h3>{event.name || event.title}</h3>
                                    </div>
                                    <span className="event-type">{event.event_type_code}</span>
                                </div>
                                <p className="muted">
                                    {event.short_description || "Краткое описание пока не добавлено."}
                                </p>
                                <dl className="event-facts">
                                    <div>
                                        <dt>Профиль</dt>
                                        <dd>{event.profile_code || "Не указан"}</dd>
                                    </div>
                                    <div>
                                        <dt>Формат участия</dt>
                                        <dd>{event.participation_mode || "Не указан"}</dd>
                                    </div>
                                    <div>
                                        <dt>Уровень</dt>
                                        <dd>{event.level_code || "Не указан"}</dd>
                                    </div>
                                </dl>
                                <div className="action-row">
                                    <Link className="button" to={`/events/${event.id}`}>
                                        Открыть событие
                                    </Link>
                                    {event.official_url && (
                                        <a
                                            className="button button-secondary"
                                            href={event.official_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Официальный сайт
                                        </a>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </PageLayout>
    );
}
