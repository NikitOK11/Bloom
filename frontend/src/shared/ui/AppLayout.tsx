import { NavLink, Outlet } from "react-router-dom";

const navItems = [
    { to: "/", label: "Главная", end: true },
    { to: "/events", label: "События" },
    { to: "/olympiads", label: "Олимпиады" },
];

export function AppLayout() {
    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="container header-inner">
                    <div className="brand-block">
                        <NavLink className="brand-link" to="/" end>
                            <span className="brand-mark">Bloom</span>
                            <span className="brand-subtitle">
                                Платформа для олимпиад, хакатонов и кейс-чемпионатов
                            </span>
                        </NavLink>
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
                <Outlet />
            </main>

            <footer className="app-footer">
                <div className="container footer-inner">
                    <p className="footer-title">Bloom frontend</p>
                    <p className="footer-copy">
                        CSR-каркас для каталога событий. Текущий Django UI пока остаётся
                        рабочим и не переносится в этом PR.
                    </p>
                </div>
            </footer>
        </div>
    );
}
