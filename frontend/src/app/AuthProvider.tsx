import {
    createContext,
    type PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    authApi,
    type AuthUser,
    type LoginPayload,
    type SignupPayload,
} from "../shared/api/auth";

type AuthContextValue = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (payload: LoginPayload) => Promise<AuthUser>;
    signup: (payload: SignupPayload) => Promise<AuthUser>;
    logout: () => Promise<void>;
    refreshCurrentUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshCurrentUser = async () => {
        setIsLoading(true);
        try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void refreshCurrentUser();
    }, []);

    const login = async (payload: LoginPayload) => {
        const response = await authApi.login(payload);
        setUser(response.user);
        return response.user;
    };

    const signup = async (payload: SignupPayload) => {
        const response = await authApi.signup(payload);
        setUser(response.user);
        return response.user;
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: Boolean(user),
                isLoading,
                login,
                signup,
                logout,
                refreshCurrentUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
}
