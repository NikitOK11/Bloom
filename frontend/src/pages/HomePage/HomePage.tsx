import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../../shared/api/client";
import { PageLayout } from "../../shared/ui/PageLayout";

type ApiStatus = "idle" | "loading" | "available" | "unavailable";

export function HomePage() {
    const [status, setStatus] = useState<ApiStatus>("idle");

    const checkApi = async () => {
        setStatus("loading");
        try {
            await apiClient.get<{ status: string }>("/health/");
            setStatus("available");
        } catch {
            setStatus("unavailable");
        }
    };

    useEffect(() => {
        void checkApi();
    }, []);

    return (
        <PageLayout
            title="Bloom"
            description="Платформа для олимпиад, хакатонов и кейс-чемпионатов. Новый React frontend становится удобным основным CSR-каркасом, при этом текущий Django UI пока остаётся рабочим."
        >
            <section className="card">
                <h2>Новый основной каркас</h2>
                <p>
                    Мы собираем отдельное CSR-приложение на React + Vite + TypeScript
                    вокруг канонической сущности Event, не ломая существующие
                    серверные страницы и пользовательские сценарии.
                </p>
                <div className="action-row">
                    <Link className="button" to="/events">
                        Открыть события
                    </Link>
                    <Link className="button button-secondary" to="/olympiads">
                        Открыть олимпиады
                    </Link>
                </div>
            </section>

            <section className="card">
                <div className="card-header">
                    <div>
                        <h2>Проверка подключения к API</h2>
                        <p className="muted">
                            Используется текущий backend endpoint <code>/api/health/</code>.
                        </p>
                    </div>
                    <button className="button" type="button" onClick={() => void checkApi()}>
                        Проверить API
                    </button>
                </div>
                <p className="status-line">
                    {status === "idle" && "Проверка API ещё не запускалась"}
                    {status === "loading" && "Проверяем доступность API..."}
                    {status === "available" && "API доступен"}
                    {status === "unavailable" && "API недоступен в dev-режиме"}
                </p>
            </section>
        </PageLayout>
    );
}
