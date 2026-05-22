import { NavLink, Outlet } from "react-router-dom";

import bloomLogomark from "../../assets/home/bloom-logomark.png";

type IconProps = {
    className?: string;
};

function HomeIcon({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M4 10.5 12 4l8 6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M6.5 9.5V20h11V9.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function EventsIcon({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M7 4v3M17 4v3M5 9h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <rect
                x="5"
                y="6"
                width="14"
                height="13"
                rx="2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
            />
            <path
                d="M9 13h2.5M9 16h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
        </svg>
    );
}

function TeamsIcon({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="1.9" />
            <circle cx="16.5" cy="11" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
            <path
                d="M4.5 19a4.5 4.5 0 0 1 9 0M14 18.5a3.5 3.5 0 0 1 6 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
        </svg>
    );
}

function ProfileIcon({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
            <path
                d="M5.5 19a6.5 6.5 0 0 1 13 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
        </svg>
    );
}

const navItems = [
    { to: "/", label: "Главная", end: true, icon: HomeIcon },
    { to: "/events/", label: "События", icon: EventsIcon },
    { to: "/teams/new", label: "Команды", icon: TeamsIcon },
    { to: "/profile", label: "Профиль", icon: ProfileIcon },
];

export function AppLayout() {
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
                </div>
            </header>

            <main className="container page-content">
                <Outlet />
            </main>

            <footer className="app-footer">
                <div className="container footer-inner">
                    <p className="footer-title">Bloom frontend</p>
                    <p className="footer-copy">
                        Плоский CSR-интерфейс для каталога событий, команд и профиля на базе
                        Django API.
                    </p>
                </div>
            </footer>
        </div>
    );
}
