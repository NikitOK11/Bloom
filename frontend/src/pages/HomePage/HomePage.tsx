import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import deviceDesktop from "../../assets/home/device-desktop.jpg";
import deviceMobile from "../../assets/home/device-mobile.jpg";
import featureOlympiadDesktop from "../../assets/home/feature-olympiad-desktop.jpg";
import featureOlympiadMobile from "../../assets/home/feature-olympiad-mobile.jpg";
import featurePreferencesDesktop from "../../assets/home/feature-preferences-desktop.jpg";
import featurePreferencesMobile from "../../assets/home/feature-preferences-mobile.jpg";
import heroDesktop from "../../assets/home/hero-desktop.jpg";
import heroMobile from "../../assets/home/hero-mobile.jpg";
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
            description="Платформа для олимпиад, хакатонов и кейс-чемпионатов. Теперь React frontend использует собственные assets и остаётся самостоятельным CSR-каркасом."
        >
            <section className="card home-hero-card">
                <div className="home-hero-grid">
                    <div className="home-hero-copy">
                        <h2>Новый основной каркас</h2>
                        <p>
                            Мы собираем отдельное CSR-приложение на React + Vite +
                            TypeScript вокруг канонической сущности Event, не ломая
                            существующие серверные страницы и пользовательские сценарии.
                        </p>
                        <div className="action-row">
                            <Link className="button" to="/events">
                                Открыть события
                            </Link>
                            <Link className="button button-secondary" to="/olympiads">
                                Открыть олимпиады
                            </Link>
                        </div>
                    </div>

                    <picture className="home-hero-media">
                        <source srcSet={heroMobile} media="(max-width: 700px)" />
                        <img src={heroDesktop} alt="Интерфейс Bloom с каталогом событий" />
                    </picture>
                </div>
            </section>

            <section className="home-showcase">
                <article className="card showcase-card">
                    <div className="showcase-copy">
                        <p className="eyebrow">События</p>
                        <h2>Каталог и страницы событий</h2>
                        <p>
                            CSR frontend уже умеет загружать реальные события, открывать
                            их детальные страницы и запускать командные сценарии там, где
                            это разрешено форматом участия.
                        </p>
                    </div>
                    <picture className="showcase-media">
                        <source srcSet={deviceMobile} media="(max-width: 700px)" />
                        <img src={deviceDesktop} alt="Карточки событий Bloom на устройстве" />
                    </picture>
                </article>

                <article className="card showcase-card">
                    <picture className="showcase-media">
                        <source srcSet={featureOlympiadMobile} media="(max-width: 700px)" />
                        <img
                            src={featureOlympiadDesktop}
                            alt="Экран события с ключевыми деталями олимпиады"
                        />
                    </picture>
                    <div className="showcase-copy">
                        <p className="eyebrow">Олимпиады</p>
                        <h2>Отдельный вход для олимпиад</h2>
                        <p>
                            Олимпиады остаются частью event-centric каталога, но получают
                            собственный маршрут и более ясный пользовательский сценарий.
                        </p>
                    </div>
                </article>

                <article className="card showcase-card">
                    <div className="showcase-copy">
                        <p className="eyebrow">Преференции</p>
                        <h2>Опора на реальные данные</h2>
                        <p>
                            От auth и профиля до команд и join request, CSR frontend
                            постепенно переходит на реальные JSON API без зависимости от
                            Django static assets.
                        </p>
                    </div>
                    <picture className="showcase-media">
                        <source srcSet={featurePreferencesMobile} media="(max-width: 700px)" />
                        <img
                            src={featurePreferencesDesktop}
                            alt="Материалы и преимущества участников событий"
                        />
                    </picture>
                </article>
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
