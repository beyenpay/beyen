import { api } from "@/api/client"
import type { CreateUserValues } from "@/schemas/user"
import type { Page } from "@/types/api"
import type { UserRow } from "@/types/user"

export type ListUsersParams = {
    page: number
    pageSize: number
    // The table's URL filters: q, q_op (eq | contains), status, role (a,b),
    // created_from and created_to (unix seconds, inclusive).
    filters: Record<string, string>
}

// Digits only; anything else in a hand-edited URL is dropped instead of sent.
const unix = (v: string | undefined) => (v && /^\d+$/.test(v) ? v : undefined)

export function listUsers({ page, pageSize, filters }: ListUsersParams, signal?: AbortSignal) {
    return api.get<Page<UserRow>>("/console/system/users", {
        signal,
        query: {
            page,
            page_size: pageSize,
            q: filters.q,
            q_op: filters.q_op,
            status: filters.status,
            role: filters.role,
            created_from: unix(filters.created_from),
            created_to: unix(filters.created_to),
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
