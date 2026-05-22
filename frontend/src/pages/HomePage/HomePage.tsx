import { Link } from "react-router-dom";

import deviceDesktop from "../../assets/home/device-desktop.jpg";
import deviceMobile from "../../assets/home/device-mobile.jpg";
import featureOlympiadDesktop from "../../assets/home/feature-olympiad-desktop.jpg";
import featureOlympiadMobile from "../../assets/home/feature-olympiad-mobile.jpg";
import featurePreferencesDesktop from "../../assets/home/feature-preferences-desktop.jpg";
import featurePreferencesMobile from "../../assets/home/feature-preferences-mobile.jpg";
import heroDesktop from "../../assets/home/hero-desktop.jpg";
import heroMobile from "../../assets/home/hero-mobile.jpg";
import { PageLayout } from "../../shared/ui/PageLayout";

export function HomePage() {
    return (
        <PageLayout
            title="Bloom"
            description="Платформа для олимпиад, хакатонов и кейс-чемпионатов с event-centric каталогом, командными сценариями и личным профилем."
        >
            <section className="card home-hero-card">
                <div className="home-hero-grid">
                    <div className="home-hero-copy">
                        <h2>Единый вход в студенческие возможности</h2>
                        <p>
                            Bloom помогает быстро перейти от интереса к событию к конкретным
                            действиям: изучить каталог, открыть детали, собрать команду и держать
                            профиль под рукой в одном плоском интерфейсе.
                        </p>
                        <div className="action-row">
                            <Link className="button" to="/events/">
                                Открыть события
                            </Link>
                            <Link className="button button-secondary" to="/teams/new">
                                Создать команду
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
                            В каталоге собраны реальные события, а каждая карточка ведёт к
                            подробной странице с форматом участия, профилем и дальнейшими шагами.
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
                        <p className="eyebrow">Детали</p>
                        <h2>Быстрый переход к нужному событию</h2>
                        <p>
                            Интерфейс ведёт пользователя прямо к содержанию: без лишних слоёв, с
                            акцентом на факты о событии и понятную навигацию между основными
                            разделами.
                        </p>
                    </div>
                </article>

                <article className="card showcase-card">
                    <div className="showcase-copy">
                        <p className="eyebrow">Команды</p>
                        <h2>Командный сценарий без перегруза</h2>
                        <p>
                            Для событий с командным или смешанным участием можно сразу перейти к
                            созданию команды, открыть её страницу и управлять откликами через
                            единый сценарий.
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
        </PageLayout>
    );
}
