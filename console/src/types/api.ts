// Mirrors gateway/pkg/response.Body. `code` is set only on failures,
// `data` only on successes that carry a payload.
export type ApiBody = {
    code?: string
    message: string
    data?: unknown
}

// Mirrors gateway dto/console Page[T].
export type Page<T> = {
    items: T[]
    total: number
    page: number
    page_size: number
}