import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { eventsApi, type EventDetail } from "../../shared/api/events";
import { PageLayout } from "../../shared/ui/PageLayout";

type LoadState = "loading" | "success" | "error";

export function EventDetailPage() {
    const { eventId } = useParams();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [state, setState] = useState<LoadState>("loading");

    useEffect(() => {
        if (!eventId) {
            setState("error");
            return;
        }

        let isMounted = true;

        const loadEvent = async () => {
            setState("loading");
            try {
                const data = await eventsApi.getById(eventId);
                if (!isMounted) {
                    return;
                }
                setEvent(data);
                setState("success");
            } catch {
                if (!isMounted) {
                    return;
                }
                setState("error");
            }
        };

        void loadEvent();

        return () => {
            isMounted = false;
        };
    }, [eventId]);

    const pageTitle = event?.name || event?.title || "Страница события";
    const canCreateTeam =
        event?.participation_mode === "team" || event?.participation_mode === "hybrid";

    return (
        <PageLayout
            title={pageTitle}
            description="Карточка события загружает реальные данные Event из Django API и показывает базовую информацию без миграции старых шаблонов."
        >
            {state === "loading" && (
                <section className="card">
                    <p>Загружаем событие...</p>
                </section>
            )}

            {state === "error" && (
                <section className="card">
                    <h2>Событие недоступно</h2>
                    <p>Не удалось загрузить данные события по этому идентификатору.</p>
                    <div className="action-row">
                        <Link className="button" to="/events">
                            Вернуться к событиям
                        </Link>
                    </div>
                </section>
            )}

            {state === "success" && event && (
                <>
                    <section className="card">
                        <div className="event-card-header">
                            <div>
                                <p className="event-meta">
                                    {event.organizer || "Организатор не указан"}
                                </p>
                                <h2>{event.name || event.title}</h2>
                            </div>
                            <span className="event-type">{event.event_type_code}</span>
                        </div>
                        <p>{event.description || event.short_description || "Описание пока не добавлено."}</p>
                        <dl className="event-facts">
                            <div>
                                <dt>Профиль</dt>
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
                            <div>
                                <dt>Регистрация до</dt>
                                <dd>{event.registration_deadline || "Дата не указана"}</dd>
                            </div>
                        </dl>
                        <div className="action-row">
                            <Link className="button button-secondary" to="/events">
                                Все события
                            </Link>
                            {canCreateTeam && (
                                <Link className="button button-secondary" to={`/teams/new?eventId=${event.id}`}>
                                    Создать команду
                                </Link>
                            )}
                            {event.official_url && (
                                <a
                                    className="button"
                                    href={event.official_url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Официальный сайт
                                </a>
                            )}
                        </div>
                    </section>

                    <section className="card">
                        <h2>Сезоны события</h2>
                        {event.editions.length === 0 && (
                            <p>Для этого события пока нет опубликованных сезонов.</p>
                        )}
                        {event.editions.length > 0 && (
                            <div className="edition-list">
                                {event.editions.map((edition) => (
                                    <article key={edition.id} className="edition-card">
                                        <h3>{edition.edition_label || `Сезон #${edition.id}`}</h3>
                                        <p className="muted">Статус: {edition.status || "не указан"}</p>
                                        <p>
                                            Период: {edition.start_date || "дата не указана"} -{" "}
                                            {edition.end_date || "дата не указана"}
                                        </p>
                                        <p>
                                            Этапов:{" "}
                                            {edition.total_stages === null
                                                ? "не указано"
                                                : edition.total_stages}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </PageLayout>
    );
}
