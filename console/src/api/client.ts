import { API_BASE_URL, API_TIMEOUT_MS } from "@/config/api"
import type { ApiBody } from "@/types/api"

import { ApiError } from "./errors"

type QueryParams = Record<string, string | number | boolean | null | undefined>

type RequestOptions = {
    query?: QueryParams
    body?: unknown
    // Pass the queryFn's `signal` so TanStack Query can cancel the request.
    signal?: AbortSignal
    // Overrides API_TIMEOUT_MS for slow endpoints.
    timeout?: number
}

type RequestExtras = Omit<RequestOptions, "body">

// Only used when the response has no gateway error code, e.g. an nginx error page.
function codeFromStatus(status: number) {
    switch (status) {
        case 400:
            return "BAD_REQUEST"
        case 401:
            return "UNAUTHORIZED"
        case 403:
            return "PERMISSION_DENIED"
        case 404:
            return "ENDPOINT_NOT_FOUND"
        case 429:
            return "RATE_LIMITED"
        case 502:
        case 503:
        case 504:
            return "SERVICE_UNAVAILABLE"
        default:
            return "INTERNAL_ERROR"
    }
}

function buildUrl(path: string, query?: QueryParams) {
    const url = `${API_BASE_URL}${path}`
    if (!query) {
        return url
    }

    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
            search.set(key, String(value))
        }
    }

    const qs = search.toString()
    return qs ? `${url}?${qs}` : url
}

function parseJson(text: string): ApiBody | null {
    if (!text) {
        return null
    }
    try {
        return JSON.parse(text) as ApiBody
    } catch {
        return null // not JSON, e.g. an HTML error page
    }
}

// Maps a fetch failure (no usable response) to an ApiError.
function toTransportError(error: unknown, callerSignal?: AbortSignal) {
    // Cancelled by the caller (e.g. a query being unmounted): not a failure,
    // so keep the original error for TanStack Query to ignore.
    if (callerSignal?.aborted) {
        return error
    }
    if (error instanceof DOMException && error.name === "TimeoutError") {
        return new ApiError("TIMEOUT", "request timed out")
    }
    return new ApiError("NETWORK_ERROR", "network error")
}

async function send(method: string, path: string, options: RequestOptions) {
    const { query, body, signal, timeout = API_TIMEOUT_MS } = options

    const timeoutSignal = AbortSignal.timeout(timeout)
    const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

    try {
        const res = await fetch(buildUrl(path, query), {
            method,
            headers: {
                Accept: "application/json",
                ...(body !== undefined && { "Content-Type": "application/json" }),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: combined,
        })
        const text = await res.text()
        return { ok: res.ok, status: res.status, body: parseJson(text) }
    } catch (error) {
        throw toTransportError(error, signal)
    }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}) {
    const { ok, status, body } = await send(method, path, options)

    if (!ok) {
        throw new ApiError(
            body?.code ?? codeFromStatus(status),
            body?.message ?? `HTTP ${status}`,
            status,
        )
    }

    // 2xx without the gateway envelope, e.g. nginx falling back to index.html
    // for an unknown /api path.
    if (body === null) {
        throw new ApiError("INTERNAL_ERROR", "unexpected response", status)
    }

    return body.data as T
}

// Gateway client. Paths are relative to /api, e.g. api.get("/console/me").
// It only throws ApiError; showing errors is query-client.ts's job.
export const api = {
    get: <T>(path: string, options?: RequestExtras) => request<T>("GET", path, options),
    post: <T>(path: string, body?: unknown, options?: RequestExtras) =>
        request<T>("POST", path, { ...options, body }),
    put: <T>(path: string, body?: unknown, options?: RequestExtras) =>
        request<T>("PUT", path, { ...options, body }),
    patch: <T>(path: string, body?: unknown, options?: RequestExtras) =>
        request<T>("PATCH", path, { ...options, body }),
    delete: <T>(path: string, options?: RequestExtras) => request<T>("DELETE", path, options),
}