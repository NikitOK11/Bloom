import type { ComponentType } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider";
import bloomLogomark from "../../assets/home/bloom-logomark.png";

type IconProps = {
    className?: string;
};

function HomeIcon({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M5.25 10.4 12 5.25l6.75 5.15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7.6 9.6V18.5h8.8V9.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function EventsIcon({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <rect
                x="5.2"
                y="6.4"
                width="13.6"
                height="12"
                rx="2.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M8.2 4.9v2.8M15.8 4.9v2.8M5.8 9.8h12.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function TeamsIcon({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="9.8" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="15.8" cy="10.5" r="1.9" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
                d="M5.3 17.8a3.7 3.7 0 0 1 7.4 0M13.4 17.5a3 3 0 0 1 5.1 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

function ProfileIcon({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8.3" r="2.9" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
                d="M6.45 18.15a5.55 5.55 0 0 1 11.1 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

function AuthIcon({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M13.5 6.25h3.4a1.85 1.85 0 0 1 1.85 1.85v7.8a1.85 1.85 0 0 1-1.85 1.85h-3.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10.25 8.9 13.2 12l-2.95 3.1M13 12H5.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

type NavItem = {
    to: string;
    label: string;
    end?: boolean;
    icon: ComponentType<IconProps>;
};

export function AppLayout() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    const navItems: NavItem[] = [
        { to: "/", label: "Главная", end: true, icon: HomeIcon },
        { to: "/events/", label: "События", icon: EventsIcon },
        { to: "/teams/new", label: "Команды", icon: TeamsIcon },
        isAuthenticated
            ? { to: "/profile", label: "Профиль", icon: ProfileIcon }
            : { to: "/login", label: "Войти / Регистрация", icon: AuthIcon },
    ];

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="container header-inner">
                    <NavLink className="brand-link" to="/" end>
                        <span className="brand-lockup">
                            <img className="brand-logo" src={bloomLogomark} alt="" width={40} height={40} />
                            <span className="brand-mark">Bloom</span>
                        </span>
                    </NavLink>

                    <nav className="nav" aria-label="Основная навигация">
                        {navItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.to}
                                    className={({ isActive }) =>
                                        isActive ? "nav-link nav-link-active" : "nav-link"
                                    }
                                    to={item.to}
                                    end={item.end}
                                >
                                    <Icon className="nav-icon" />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="header-balance" aria-hidden="true" />
                </div>
            </header>

            <main className="container page-content">
                <div key={location.pathname} className="page-stage">
                    <Outlet />
                </div>
            </main>

            <footer className="app-footer">
                <div className="container footer-inner">
                    <p className="footer-title">Bloom frontend</p>
                    <p className="footer-copy">
                        Плоский CSR-интерфейс для каталога событий, команд и профиля на базе Django API.
                    </p>
                </div>
            </footer>
        </div>
    );
}
