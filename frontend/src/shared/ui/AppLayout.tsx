import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { useAuth } from "../../app/AuthProvider";

const navItems = [
    { to: "/", label: "Главная", end: true },
    { to: "/events", label: "События" },
    { to: "/olympiads", label: "Олимпиады" },
];

function getAuthErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        if (typeof error.data === "object" && error.data && "detail" in error.data) {
            return String(error.data.detail);
        }
        return "Не удалось выполнить действие с аккаунтом.";
    }
    return "Произошла непредвиденная ошибка.";
}

export function AppLayout() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLogoutError(null);
        setIsLoggingOut(true);
        try {
            await logout();
            navigate("/", { replace: true });
        } catch (error) {
            setLogoutError(getAuthErrorMessage(error));
        } finally {
            setIsLoggingOut(false);
        }
    };

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

                    <div className="header-actions">
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

                        <div className="nav-auth" aria-live="polite">
                            {isLoading && <span className="auth-pill">Проверяем сессию...</span>}

                            {!isLoading && !isAuthenticated && (
                                <>
                                    <NavLink
                                        className={({ isActive }) =>
                                            isActive ? "nav-link nav-link-active" : "nav-link"
                                        }
                                        to="/login"
                                    >
                                        Войти
                                    </NavLink>
                                    <NavLink
                                        className={({ isActive }) =>
                                            isActive ? "nav-link nav-link-active" : "nav-link"
                                        }
                                        to="/signup"
                                    >
                                        Регистрация
                                    </NavLink>
                                </>
                            )}

                            {!isLoading && isAuthenticated && user && (
                                <>
                                    <span className="auth-pill">{user.email}</span>
                                    <button
                                        className="nav-button"
                                        type="button"
                                        onClick={() => void handleLogout()}
                                        disabled={isLoggingOut}
                                    >
                                        {isLoggingOut ? "Выходим..." : "Выйти"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {logoutError && (
                    <div className="container">
                        <p className="header-error">{logoutError}</p>
                    </div>
                )}
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
