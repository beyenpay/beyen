import { api } from "@/api/client"
import type { SetupValues } from "@/schemas/auth"
import type { UserInfo } from "@/types/me"

export function fetchSetupStatus(signal?: AbortSignal) {
    return api.get<{ needs_setup: boolean }>("/console/setup/status", { signal })
}

// The confirm field is checked in the browser only; the gateway never sees it.
export function setupAdmin({ email, password }: SetupValues) {
    return api.post<UserInfo>("/console/setup", { email, password })
}
