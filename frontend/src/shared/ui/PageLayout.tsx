import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

type PageLayoutProps = PropsWithChildren<{
    title: string;
    description: string;
}>;

const navItems = [
    { to: "/", label: "Bloom", end: true },
    { to: "/events", label: "События" },
    { to: "/olympiads", label: "Олимпиады" },
];

export function PageLayout({ children, title, description }: PageLayoutProps) {
    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="container header-inner">
                    <div>
                        <p className="eyebrow">Bloom frontend</p>
                        <h1 className="brand-title">CSR foundation</h1>
                    </div>
                    <nav className="nav" aria-label="Основная навигация">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                className={({ isActive }) =>
                                    isActive ? "nav-link nav-link-active" : "nav-link"
                                }
                                to={item.to}
                                end={item.end}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="container page-content">
                <section className="hero">
                    <p className="eyebrow">Bloom</p>
                    <h2>{title}</h2>
                    <p className="hero-copy">{description}</p>
                </section>
                {children}
            </main>
        </div>
    );
}
