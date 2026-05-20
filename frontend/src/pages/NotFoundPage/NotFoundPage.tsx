import { Link } from "react-router-dom";

import { PageLayout } from "../../shared/ui/PageLayout";

export function NotFoundPage() {
    return (
        <PageLayout
            title="Страница не найдена"
            description="Маршрут не найден. Можно вернуться на главную страницу Bloom или открыть каталог событий."
        >
            <section className="card">
                <h2>Ошибка 404</h2>
                <p>Запрошенный маршрут пока не существует в новом frontend.</p>
                <div className="action-row">
                    <Link className="button" to="/">
                        На главную
                    </Link>
                    <Link className="button button-secondary" to="/events">
                        К событиям
                    </Link>
                </div>
            </section>
        </PageLayout>
    );
}
