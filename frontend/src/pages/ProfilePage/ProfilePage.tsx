import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { authApi, type AuthUser } from "../../shared/api/auth";
import { ApiError } from "../../shared/api/client";
import { PageLayout } from "../../shared/ui/PageLayout";

type ProfileState = "loading" | "ready" | "anonymous" | "error";

export function ProfilePage() {
    const [state, setState] = useState<ProfileState>("loading");
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            setState("loading");
            try {
                const currentUser = await authApi.getCurrentUser();
                if (!isMounted) {
                    return;
                }

                if (!currentUser) {
                    setUser(null);
                    setState("anonymous");
                    return;
                }

                setUser(currentUser);
                setState("ready");
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                    setUser(null);
                    setState("anonymous");
                    return;
                }

                setState("error");
            }
        };

        void loadProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <PageLayout
            title="Профиль"
            description="Базовая CSR-страница профиля показывает данные текущего пользователя из Django auth API."
        >
            {state === "loading" && (
                <section className="card auth-card">
                    <p>Загружаем профиль...</p>
                </section>
            )}

            {state === "error" && (
                <section className="card auth-card">
                    <h2>Профиль временно недоступен</h2>
                    <p>Не удалось загрузить данные пользователя. Попробуйте обновить страницу позже.</p>
                </section>
            )}

            {state === "anonymous" && (
                <section className="card auth-card">
                    <h2>Нужен вход в аккаунт</h2>
                    <p>
                        Чтобы посмотреть профиль, войдите в Bloom через существующую
                        session-based аутентификацию.
                    </p>
                    <div className="action-row">
                        <Link className="button" to="/login">
                            Перейти ко входу
                        </Link>
                    </div>
                </section>
            )}

            {state === "ready" && user && (
                <section className="card auth-card">
                    <h2>Данные аккаунта</h2>
                    <dl className="profile-grid">
                        <div>
                            <dt>Email</dt>
                            <dd>{user.email}</dd>
                        </div>
                        <div>
                            <dt>Имя</dt>
                            <dd>{user.first_name || "Не указано"}</dd>
                        </div>
                        <div>
                            <dt>Фамилия</dt>
                            <dd>{user.last_name || "Не указана"}</dd>
                        </div>
                        <div>
                            <dt>Телефон</dt>
                            <dd>{user.phone || "Не указан"}</dd>
                        </div>
                    </dl>
                </section>
            )}
        </PageLayout>
    );
}
