import { ApiError, apiClient } from "./client";

export type AuthUser = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
};

type AuthResponse = {
    detail: string;
    user: AuthUser;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type SignupPayload = {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    password: string;
    password_confirm: string;
};

export const authApi = {
    async getCurrentUser() {
        try {
            return await apiClient.get<AuthUser>("/accounts/me/");
        } catch (error) {
            if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                return null;
            }
            throw error;
        }
    },
    async login(payload: LoginPayload) {
        return apiClient.post<AuthResponse>("/accounts/login/", payload);
    },
    async signup(payload: SignupPayload) {
        return apiClient.post<AuthResponse>("/accounts/signup/", payload);
    },
    async logout() {
        return apiClient.post<{ detail: string }>("/accounts/logout/", {});
    },
};
