import { PageLayout } from "../../shared/ui/PageLayout";

export function OlympiadsPage() {
    return (
        <PageLayout
            title="Олимпиады"
            description="В Bloom олимпиады — это события с типом event_type = olympiad. Отдельная legacy-модель для олимпиад не возвращается."
        >
            <section className="card">
                <h2>Маршрут для олимпиад</h2>
                <p>
                    Эта CSR-страница резервирует отдельный пользовательский маршрут для олимпиад как
                    категории событий и будет постепенно получать собственные фильтры и сценарии.
                </p>
            </section>
        </PageLayout>
    );
}
