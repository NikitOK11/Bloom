import { API_BASE_URL } from "../config/env";

type RequestOptions = RequestInit & {
    body?: BodyInit | object | null;
};

function buildUrl(path: string) {
    const normalizedBase = API_BASE_URL.endsWith("/")
        ? API_BASE_URL.slice(0, -1)
        : API_BASE_URL;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers = new Headers(options.headers);
    let body = options.body;

    if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify(body);
    }

    const response = await fetch(buildUrl(path), {
        ...options,
        body: body ?? undefined,
        headers,
        credentials: "include",
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
            `API request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
        );
    }

    if (response.status === 204) {
        return null as T;
    }

    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
        return (await response.json()) as T;
    }

    const text = await response.text();
    return (text ? (text as T) : null) as T;
}

export const apiClient = {
    get: <T>(path: string, options?: RequestOptions) =>
        request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body?: RequestOptions["body"], options?: RequestOptions) =>
        request<T>(path, { ...options, method: "POST", body }),
};
