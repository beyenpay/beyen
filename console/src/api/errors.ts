// Thrown by api/client.ts for every failed gateway request.
//
// `code` is the gateway's stable error code, or one of two the client defines:
//   NETWORK_ERROR  no response at all (offline, connection refused)
//   TIMEOUT        no response within the time limit
// `status` is the HTTP status, undefined when there was no response.
// `message` is an English fallback for debugging, never shown to users.
export class ApiError extends Error {
    code: string
    status?: number

    constructor(code: string, message: string, status?: number) {
        super(message)
        this.name = "ApiError"
        this.code = code
        this.status = status
    }
}