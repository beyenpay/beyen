import { api } from "@/api/client"
import type { LoginValues } from "@/schemas/auth"
import type { UserInfo } from "@/types/me"

// The response only carries the user; the permissions come from GET /console/me.
export function login(values: LoginValues) {
    return api.post<{ user: UserInfo }>("/console/auth/login", values)
}

// Works with or without a valid session; the gateway clears the cookie either way.
export function logout() {
    return api.post<null>("/console/auth/logout")
}