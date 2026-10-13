// Mirrors gateway/pkg/response.Body. `code` is set only on failures,
// `data` only on successes that carry a payload.
export type ApiBody = {
    code?: string
    message: string
    data?: unknown
}