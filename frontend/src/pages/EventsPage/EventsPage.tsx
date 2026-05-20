import { PageLayout } from "../../shared/ui/PageLayout";

export function EventsPage() {
    return (
        <PageLayout
            title="События"
            description="Здесь будет client-side каталог событий Bloom. В следующих PR мы постепенно перенесём поиск, фильтры и карточки событий из Django UI в React."
        >
            <section className="card">
                <h2>CSR-каталог событий</h2>
                <p>
                    На этом этапе страница задаёт архитектурный каркас для будущего event-centric
                    каталога без изменения текущих backend маршрутов и шаблонов.
                </p>
            </section>
        </PageLayout>
    );
}
