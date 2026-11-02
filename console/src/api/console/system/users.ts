import { api } from "@/api/client"
import type { CreateUserValues } from "@/schemas/user"
import type { Page } from "@/types/api"
import type { UserRow } from "@/types/user"

export type ListUsersParams = {
    page: number
    pageSize: number
    // Field name and direction, or null for the endpoint's own order (newest first).
    sort: { key: string; dir: "asc" | "desc" } | null
    // The table's URL filters: q, q_op (eq | contains), comment, status, role (a,b),
    // created_from and created_to (unix seconds, inclusive).
    filters: Record<string, string>
}

// Digits only; anything else in a hand-edited URL is dropped instead of sent.
const unix = (v: string | undefined) => (v && /^\d+$/.test(v) ? v : undefined)

export function listUsers({ page, pageSize, sort, filters }: ListUsersParams, signal?: AbortSignal) {
    return api.get<Page<UserRow>>("/console/system/users", {
        signal,
        query: {
            page,
            page_size: pageSize,
            sort: sort?.key,
            dir: sort?.dir,
            q: filters.q,
            q_op: filters.q_op,
            comment: filters.comment,
            status: filters.status,
            role: filters.role,
            created_from: unix(filters.created_from),
            created_to: unix(filters.created_to),
        },
    })
}

// The form's `role` is the gateway's `system_role`; empty means a normal user.
export function createUser({ email, password, role, comment }: CreateUserValues) {
    return api.post<UserRow>("/console/system/users", {
        email,
        password,
        system_role: role === "admin" ? "admin" : "",
        comment: comment.trim(),
    })
}

// Only the fields that changed. `role` is the gateway's `system_role`.
export type UserPatch = {
    email?: string
    role?: "user" | "admin"
    status?: "active" | "disabled"
    comment?: string
}

export function updateUser(id: number, patch: UserPatch) {
    return api.patch<UserRow>(`/console/system/users/${id}`, {
        email: patch.email,
        system_role: patch.role === undefined ? undefined : patch.role === "admin" ? "admin" : "",
        status: patch.status === undefined ? undefined : patch.status === "active" ? 1 : 2,
        comment: patch.comment,
    })
}

// The user is marked deleted, not removed; restoreUser brings them back.
export function deleteUser(id: number) {
    return api.delete<null>(`/console/system/users/${id}`)
}

export function restoreUser(id: number) {
    return api.post<UserRow>(`/console/system/users/${id}/restore`)
}

export function resetUserPassword(id: number, password: string) {
    return api.post<null>(`/console/system/users/${id}/password`, { password })
}
