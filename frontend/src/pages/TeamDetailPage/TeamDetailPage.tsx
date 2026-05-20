import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider";
import { ApiError } from "../../shared/api/client";
import { teamsApi, type TeamDetail } from "../../shared/api/teams";
import { PageLayout } from "../../shared/ui/PageLayout";

type LoadState = "loading" | "success" | "error";

function getJoinErrorMessage(error: unknown) {
    if (error instanceof ApiError && error.data && typeof error.data === "object") {
        if ("team" in error.data && Array.isArray(error.data.team)) {
            return String(error.data.team[0]);
        }
        if ("user" in error.data && Array.isArray(error.data.user)) {
            return String(error.data.user[0]);
        }
        if ("detail" in error.data) {
            return String(error.data.detail);
        }
    }
    return "Не удалось отправить заявку в команду.";
}

export function TeamDetailPage() {
    const { teamId } = useParams();
    const { isAuthenticated } = useAuth();
    const [team, setTeam] = useState<TeamDetail | null>(null);
    const [state, setState] = useState<LoadState>("loading");
    const [joinMessage, setJoinMessage] = useState("");
    const [joinState, setJoinState] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [joinError, setJoinError] = useState<string | null>(null);

    useEffect(() => {
        if (!teamId) {
            setState("error");
            return;
        }

        let isMounted = true;

        const loadTeam = async () => {
            setState("loading");
            try {
                const data = await teamsApi.getById(teamId);
                if (!isMounted) {
                    return;
                }
                setTeam(data);
                setState("success");
            } catch {
                if (!isMounted) {
                    return;
                }
                setState("error");
            }
        };

        void loadTeam();

        return () => {
            isMounted = false;
        };
    }, [teamId]);

    const handleJoinRequest = async () => {
        if (!teamId) {
            return;
        }

        setJoinState("submitting");
        setJoinError(null);
        try {
            await teamsApi.createJoinRequest(teamId, { message: joinMessage });
            const refreshedTeam = await teamsApi.getById(teamId);
            setTeam(refreshedTeam);
            setJoinMessage("");
            setJoinState("success");
        } catch (error) {
            setJoinError(getJoinErrorMessage(error));
            setJoinState("error");
        }
    };

    const pageTitle = team?.name || "Команда";

    return (
        <PageLayout
            title={pageTitle}
            description="Страница команды в новом CSR frontend показывает состав, событие и статус вступления."
        >
            {state === "loading" && (
                <section className="card">
                    <p>Загружаем команду...</p>
                </section>
            )}

            {state === "error" && (
                <section className="card">
                    <h2>Команда недоступна</h2>
                    <p>Не удалось загрузить данные команды по этому идентификатору.</p>
                    <div className="action-row">
                        <Link className="button" to="/events">
                            К событиям
                        </Link>
                    </div>
                </section>
            )}

            {state === "success" && team && (
                <>
                    <section className="card">
                        <div className="event-card-header">
                            <div>
                                <p className="event-meta">
                                    {team.event.name || team.event.title}
                                </p>
                                <h2>{team.name}</h2>
                            </div>
                            <span className="event-type">
                                {team.is_open ? "Открыта" : "Закрыта"}
                            </span>
                        </div>
                        <p>{team.description || "Описание команды пока не добавлено."}</p>
                        <dl className="event-facts">
                            <div>
                                <dt>Капитан</dt>
                                <dd>{team.owner.email}</dd>
                            </div>
                            <div>
                                <dt>Событие</dt>
                                <dd>{team.event.name || team.event.title}</dd>
                            </div>
                            <div>
                                <dt>Участников</dt>
                                <dd>{team.member_count}</dd>
                            </div>
                        </dl>
                        <div className="action-row">
                            <Link
                                className="button button-secondary"
                                to={`/teams/new?eventId=${team.event.id}`}
                            >
                                Создать свою команду
                            </Link>
                        </div>
                    </section>

                    <section className="card">
                        <h2>Состав команды</h2>
                        <div className="member-list">
                            {team.memberships.map((membership) => (
                                <article key={membership.id} className="member-card">
                                    <h3>
                                        {membership.user.first_name || membership.user.last_name
                                            ? `${membership.user.first_name} ${membership.user.last_name}`.trim()
                                            : membership.user.email}
                                    </h3>
                                    <p className="muted">{membership.user.email}</p>
                                    <p>Роль: {membership.role === "CAPTAIN" ? "Капитан" : "Участник"}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="card auth-card">
                        <h2>Вступление в команду</h2>

                        {!isAuthenticated && (
                            <p>
                                Чтобы отправить заявку в команду, сначала{" "}
                                <Link className="inline-link" to="/login">
                                    войдите в аккаунт
                                </Link>
                                .
                            </p>
                        )}

                        {isAuthenticated && team.is_member && (
                            <p>Вы уже состоите в этой команде.</p>
                        )}

                        {isAuthenticated && !team.is_member && team.has_join_request && (
                            <p>Заявка уже отправлена и ожидает решения капитана.</p>
                        )}

                        {isAuthenticated && !team.can_join && !team.is_member && !team.has_join_request && (
                            <p>Сейчас в эту команду нельзя отправить заявку.</p>
                        )}

                        {isAuthenticated && team.can_join && (
                            <>
                                <label className="form-field">
                                    <span className="form-label">Сообщение капитану</span>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={joinMessage}
                                        onChange={(event) => setJoinMessage(event.target.value)}
                                        rows={4}
                                        placeholder="Коротко расскажите, почему хотите присоединиться"
                                    />
                                </label>

                                {joinError && <p className="form-error form-error-block">{joinError}</p>}
                                {joinState === "success" && (
                                    <p className="success-note">Заявка в команду успешно отправлена.</p>
                                )}

                                <div className="action-row">
                                    <button
                                        className="button"
                                        type="button"
                                        onClick={() => void handleJoinRequest()}
                                        disabled={joinState === "submitting"}
                                    >
                                        {joinState === "submitting"
                                            ? "Отправляем заявку..."
                                            : "Отправить заявку"}
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </>
            )}
        </PageLayout>
    );
}
