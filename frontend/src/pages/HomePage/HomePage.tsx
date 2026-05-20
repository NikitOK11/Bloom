import { useEffect, useState } from "react";

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
            description="Платформа для олимпиад, хакатонов и кейс-чемпионатов. Этот frontend — первый шаг к отдельной client-side архитектуре, при этом текущий Django UI остаётся рабочим."
        >
            <section className="card">
                <h2>Зачем нужен новый frontend</h2>
                <p>
                    Мы начинаем перенос product-facing интерфейса к отдельному CSR-приложению на
                    React + Vite + TypeScript, не ломая существующие Django-страницы.
                </p>
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
