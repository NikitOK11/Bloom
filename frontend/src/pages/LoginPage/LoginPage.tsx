import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider";
import { ApiError } from "../../shared/api/client";
import { PageLayout } from "../../shared/ui/PageLayout";

type LoginFormState = {
    email: string;
    password: string;
};

type LoginFieldErrors = Partial<Record<keyof LoginFormState | "non_field_errors", string[]>>;

const defaultFormState: LoginFormState = {
    email: "",
    password: "",
};

function readFieldErrors(error: unknown): LoginFieldErrors {
    if (error instanceof ApiError && error.data && typeof error.data === "object") {
        return error.data as LoginFieldErrors;
    }
    return {};
}

export function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated, isLoading } = useAuth();
    const [formState, setFormState] = useState<LoginFormState>(defaultFormState);
    const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setGeneralError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await login(formState);
            navigate("/", { replace: true });
        } catch (error) {
            const apiErrors = readFieldErrors(error);
            setFieldErrors(apiErrors);

            const nonFieldErrors = apiErrors.non_field_errors;
            if (nonFieldErrors?.length) {
                setGeneralError(nonFieldErrors.join(" "));
            } else {
                setGeneralError("Не удалось выполнить вход. Проверьте данные и попробуйте снова.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageLayout
            title="Вход"
            description="Войдите в Bloom через существующую Django session-based аутентификацию."
        >
            <section className="card auth-card">
                <h2>Войти в аккаунт</h2>
                <p className="muted">
                    Используйте email и пароль, чтобы продолжить работу в CSR frontend.
                </p>

                <form className="form-grid" onSubmit={handleSubmit} noValidate>
                    <label className="form-field">
                        <span className="form-label">Email</span>
                        <input
                            className="form-input"
                            type="email"
                            value={formState.email}
                            onChange={(event) =>
                                setFormState((current) => ({
                                    ...current,
                                    email: event.target.value,
                                }))
                            }
                            autoComplete="email"
                            required
                        />
                        {fieldErrors.email?.map((message) => (
                            <span key={message} className="form-error">
                                {message}
                            </span>
                        ))}
                    </label>

                    <label className="form-field">
                        <span className="form-label">Пароль</span>
                        <input
                            className="form-input"
                            type="password"
                            value={formState.password}
                            onChange={(event) =>
                                setFormState((current) => ({
                                    ...current,
                                    password: event.target.value,
                                }))
                            }
                            autoComplete="current-password"
                            required
                        />
                        {fieldErrors.password?.map((message) => (
                            <span key={message} className="form-error">
                                {message}
                            </span>
                        ))}
                    </label>

                    {generalError && <p className="form-error form-error-block">{generalError}</p>}

                    <div className="action-row">
                        <button className="button" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Входим..." : "Войти"}
                        </button>
                        <Link className="button button-secondary" to="/signup">
                            Регистрация
                        </Link>
                    </div>
                </form>
            </section>
        </PageLayout>
    );
}
