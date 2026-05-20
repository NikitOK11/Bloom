import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider";
import { ApiError } from "../../shared/api/client";
import { PageLayout } from "../../shared/ui/PageLayout";

type SignupFormState = {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    password: string;
    password_confirm: string;
};

type SignupFieldErrors = Partial<Record<keyof SignupFormState | "non_field_errors", string[]>>;

const defaultFormState: SignupFormState = {
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    password_confirm: "",
};

function readFieldErrors(error: unknown): SignupFieldErrors {
    if (error instanceof ApiError && error.data && typeof error.data === "object") {
        return error.data as SignupFieldErrors;
    }
    return {};
}

export function SignupPage() {
    const navigate = useNavigate();
    const { signup, isAuthenticated, isLoading } = useAuth();
    const [formState, setFormState] = useState<SignupFormState>(defaultFormState);
    const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFieldErrors({});
        setGeneralError(null);
        setIsSubmitting(true);

        try {
            await signup(formState);
            navigate("/", { replace: true });
        } catch (error) {
            const apiErrors = readFieldErrors(error);
            setFieldErrors(apiErrors);

            const nonFieldErrors = apiErrors.non_field_errors;
            if (nonFieldErrors?.length) {
                setGeneralError(nonFieldErrors.join(" "));
            } else {
                setGeneralError("Не удалось завершить регистрацию. Проверьте поля формы.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateField = (field: keyof SignupFormState, value: string) => {
        setFormState((current) => ({
            ...current,
            [field]: value,
        }));
    };

    return (
        <PageLayout
            title="Регистрация"
            description="Создайте аккаунт Bloom через существующий Django auth API и сразу получите активную сессию."
        >
            <section className="card auth-card">
                <h2>Создать аккаунт</h2>
                <p className="muted">
                    После успешной регистрации вы автоматически войдёте в систему.
                </p>

                <form className="form-grid" onSubmit={handleSubmit} noValidate>
                    <label className="form-field">
                        <span className="form-label">Email</span>
                        <input
                            className="form-input"
                            type="email"
                            value={formState.email}
                            onChange={(event) => updateField("email", event.target.value)}
                            autoComplete="email"
                            required
                        />
                        {fieldErrors.email?.map((message) => (
                            <span key={message} className="form-error">
                                {message}
                            </span>
                        ))}
                    </label>

                    <div className="form-row">
                        <label className="form-field">
                            <span className="form-label">Имя</span>
                            <input
                                className="form-input"
                                type="text"
                                value={formState.first_name}
                                onChange={(event) => updateField("first_name", event.target.value)}
                                autoComplete="given-name"
                            />
                            {fieldErrors.first_name?.map((message) => (
                                <span key={message} className="form-error">
                                    {message}
                                </span>
                            ))}
                        </label>

                        <label className="form-field">
                            <span className="form-label">Фамилия</span>
                            <input
                                className="form-input"
                                type="text"
                                value={formState.last_name}
                                onChange={(event) => updateField("last_name", event.target.value)}
                                autoComplete="family-name"
                            />
                            {fieldErrors.last_name?.map((message) => (
                                <span key={message} className="form-error">
                                    {message}
                                </span>
                            ))}
                        </label>
                    </div>

                    <label className="form-field">
                        <span className="form-label">Телефон</span>
                        <input
                            className="form-input"
                            type="tel"
                            value={formState.phone}
                            onChange={(event) => updateField("phone", event.target.value)}
                            autoComplete="tel"
                        />
                        {fieldErrors.phone?.map((message) => (
                            <span key={message} className="form-error">
                                {message}
                            </span>
                        ))}
                    </label>

                    <div className="form-row">
                        <label className="form-field">
                            <span className="form-label">Пароль</span>
                            <input
                                className="form-input"
                                type="password"
                                value={formState.password}
                                onChange={(event) => updateField("password", event.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            {fieldErrors.password?.map((message) => (
                                <span key={message} className="form-error">
                                    {message}
                                </span>
                            ))}
                        </label>

                        <label className="form-field">
                            <span className="form-label">Повторите пароль</span>
                            <input
                                className="form-input"
                                type="password"
                                value={formState.password_confirm}
                                onChange={(event) => updateField("password_confirm", event.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            {fieldErrors.password_confirm?.map((message) => (
                                <span key={message} className="form-error">
                                    {message}
                                </span>
                            ))}
                        </label>
                    </div>

                    {generalError && <p className="form-error form-error-block">{generalError}</p>}

                    <div className="action-row">
                        <button className="button" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Регистрируем..." : "Создать аккаунт"}
                        </button>
                        <Link className="button button-secondary" to="/login">
                            Уже есть аккаунт
                        </Link>
                    </div>
                </form>
            </section>
        </PageLayout>
    );
}
