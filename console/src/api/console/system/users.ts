import { api } from "@/api/client"
import type { CreateUserValues } from "@/schemas/user"
import type { Page } from "@/types/api"
import type { UserRow } from "@/types/user"

export type ListUsersParams = {
    page: number
    pageSize: number
    // The table's URL filters: q, status, role, created_from, created_to (dates as YYYY-MM-DD).
    filters: Record<string, string>
}

// A local calendar day as unix seconds; undefined for anything that is not a date.
function dayToUnix(day: string | undefined, endOfDay: boolean) {
    if (!day) {
        return undefined
    }
    const start = new Date(`${day}T00:00:00`).getTime() / 1000
    return Number.isNaN(start) ? undefined : start + (endOfDay ? 86399 : 0)
}

export function listUsers({ page, pageSize, filters }: ListUsersParams, signal?: AbortSignal) {
    return api.get<Page<UserRow>>("/console/system/users", {
        signal,
        query: {
            page,
            page_size: pageSize,
            q: filters.q,
            status: filters.status,
            role: filters.role,
            created_from: dayToUnix(filters.created_from, false),
            created_to: dayToUnix(filters.created_to, true),
        },
    })
}

// The form's `role` is the gateway's `system_role`; empty means a normal user.
export function createUser({ email, password, role }: CreateUserValues) {
    return api.post<UserRow>("/console/system/users", {
        email,
        password,
        system_role: role === "admin" ? "admin" : "",
    })
}
