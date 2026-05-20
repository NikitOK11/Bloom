import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { eventsApi, type EventListItem } from "../../shared/api/events";
import { PageLayout } from "../../shared/ui/PageLayout";

type LoadState = "loading" | "success" | "error";

export function OlympiadsPage() {
    const [events, setEvents] = useState<EventListItem[]>([]);
    const [state, setState] = useState<LoadState>("loading");

    useEffect(() => {
        let isMounted = true;

        const loadOlympiads = async () => {
            setState("loading");
            try {
                const data = await eventsApi.list({ eventType: "olympiad", isActive: true });
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

        void loadOlympiads();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <PageLayout
            title="Олимпиады"
            description="В Bloom олимпиады остаются частью единого event-centric каталога и загружаются как события с типом olympiad."
        >
            <section className="card">
                <div className="card-header">
                    <div>
                        <h2>Активные олимпиады</h2>
                        <p className="muted">
                            Страница показывает только те события, у которых
                            <code> event_type = olympiad</code>.
                        </p>
                    </div>
                    <span className="badge">API: /api/events/?event_type=olympiad</span>
                </div>

                {state === "loading" && <p>Загружаем олимпиады...</p>}
                {state === "error" && (
                    <p>Не удалось загрузить олимпиады. Проверьте доступность backend API.</p>
                )}
                {state === "success" && events.length === 0 && (
                    <p>Активные олимпиады пока не найдены.</p>
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
                                    <span className="event-type">olympiad</span>
                                </div>
                                <p className="muted">
                                    {event.short_description || "Краткое описание пока не добавлено."}
                                </p>
                                <dl className="event-facts">
                                    <div>
                                        <dt>Профиль олимпиады</dt>
                                        <dd>{event.profile_code || "Не указан"}</dd>
                                    </div>
                                    <div>
                                        <dt>Уровень</dt>
                                        <dd>{event.level_code || "Не указан"}</dd>
                                    </div>
                                    <div>
                                        <dt>Формат участия</dt>
                                        <dd>{event.participation_mode || "Не указан"}</dd>
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
