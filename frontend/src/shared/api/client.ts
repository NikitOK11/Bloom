import { API_BASE_URL } from "../config/env";

type RequestOptions = Omit<RequestInit, "body"> & {
    body?: BodyInit | object | null;
    skipCsrfBootstrap?: boolean;
};

type ErrorPayload = Record<string, unknown> | string | null;

export class ApiError extends Error {
    status: number;
    data: ErrorPayload;

    constructor(message: string, status: number, data: ErrorPayload) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

function buildUrl(path: string) {
    const normalizedBase = API_BASE_URL.endsWith("/")
        ? API_BASE_URL.slice(0, -1)
        : API_BASE_URL;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
}

function getCookie(name: string) {
    const cookieMatch = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${name}=`));
    return cookieMatch ? decodeURIComponent(cookieMatch.split("=").slice(1).join("=")) : null;
}

function isUnsafeMethod(method?: string | null) {
    const normalizedMethod = method?.toUpperCase() ?? "GET";
    return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(normalizedMethod);
}

let csrfBootstrapPromise: Promise<void> | null = null;

async function ensureCsrfCookie() {
    if (typeof document === "undefined" || getCookie("csrftoken")) {
        return;
    }

    if (!csrfBootstrapPromise) {
        csrfBootstrapPromise = fetch(buildUrl("/accounts/csrf/"), {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new ApiError(
                        `API request failed: ${response.status} ${response.statusText}`,
                        response.status,
                        await parseResponseBody(response),
                    );
                }
            })
            .finally(() => {
                csrfBootstrapPromise = null;
            });
    }

    await csrfBootstrapPromise;
}

async function parseResponseBody(response: Response) {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
        return (await response.json()) as ErrorPayload;
    }

    const text = await response.text();
    return text || null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers = new Headers(options.headers);
    let body = options.body;
    const method = options.method ?? "GET";
    const { skipCsrfBootstrap, ...fetchOptions } = options;

    if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify(body);
    }

    if (isUnsafeMethod(method) && !headers.has("X-CSRFToken") && !skipCsrfBootstrap) {
        await ensureCsrfCookie();
    }

    if (isUnsafeMethod(method) && !headers.has("X-CSRFToken")) {
        const csrfToken = getCookie("csrftoken");
        if (csrfToken) {
            headers.set("X-CSRFToken", csrfToken);
        }
    }

    const response = await fetch(buildUrl(path), {
        ...fetchOptions,
        method,
        body: body ?? undefined,
        headers,
        credentials: "include",
    });

    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
        const detail =
            typeof responseBody === "string"
                ? responseBody
                : responseBody && typeof responseBody === "object" && "detail" in responseBody
                  ? String(responseBody.detail)
                  : "";

        throw new ApiError(
            `API request failed: ${response.status} ${response.statusText}${detail ? ` - ${detail}` : ""}`,
            response.status,
            responseBody,
        );
    }

    return responseBody as T;
}

export const apiClient = {
    get: <T>(path: string, options?: RequestOptions) =>
        request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body?: RequestOptions["body"], options?: RequestOptions) =>
        request<T>(path, { ...options, method: "POST", body }),
};
