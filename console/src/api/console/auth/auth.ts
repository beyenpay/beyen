import { api } from "@/api/client"
import type { LoginValues } from "@/schemas/auth"
import type { UserInfo } from "@/types/me"

// The response only carries the user; the permissions come from GET /console/me.
export function login(values: LoginValues) {
    return api.post<{ user: UserInfo }>("/console/auth/login", values)
}