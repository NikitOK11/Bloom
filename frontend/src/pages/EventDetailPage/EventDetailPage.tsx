import { useParams } from "react-router-dom";

import { PageLayout } from "../../shared/ui/PageLayout";

export function EventDetailPage() {
    const { eventId } = useParams();

    return (
        <PageLayout
            title="Страница события"
            description="Эта страница станет CSR-экраном для просмотра деталей события, этапов, преференций и связанного пользовательского взаимодействия."
        >
            <section className="card">
                <h2>Событие</h2>
                <p>
                    Идентификатор события из маршрута:{" "}
                    <strong>{eventId ?? "не передан"}</strong>
                </p>
                <p className="muted">
                    Сейчас это безопасный placeholder без подгрузки продуктовых данных.
                </p>
            </section>
        </PageLayout>
    );
}
