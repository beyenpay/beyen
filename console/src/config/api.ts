// All API traffic is same-origin: nginx (prod) and the Vite proxy (dev)
// forward /api to the gateway, so no host is configured here.
export const API_BASE_URL = "/api"

// Console calls are plain CRUD, so anything slower is a stuck request.
// Keep this below the reverse proxy's read timeout, so users get a clear
// timeout message instead of a 504 page.
export const API_TIMEOUT_MS = 15_000