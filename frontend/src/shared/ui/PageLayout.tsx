import type { PropsWithChildren } from "react";

type PageLayoutProps = PropsWithChildren<{
    title: string;
    description: string;
}>;

export function PageLayout({ children, title, description }: PageLayoutProps) {
    return (
        <>
            <section className="hero">
                <p className="eyebrow">Bloom</p>
                <h1 className="page-title">{title}</h1>
                <p className="hero-copy">{description}</p>
            </section>
            {children}
        </>
    );
}
