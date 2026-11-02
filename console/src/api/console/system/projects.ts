import { api } from "@/api/client"
import type { CreateProjectValues } from "@/schemas/project"
import type { Page } from "@/types/api"
import type { ProjectRow } from "@/types/project"

export type ListProjectsParams = {
    page: number
    pageSize: number
    // Field name and direction, or null for the endpoint's own order (newest first).
    sort: { key: string; dir: "asc" | "desc" } | null
    // The table's URL filters: q (a part of the name), comment (a part of the note),
    // status, created_from and created_to (unix seconds, inclusive).
    filters: Record<string, string>
}

// Digits only; anything else in a hand-edited URL is dropped instead of sent.
const unix = (v: string | undefined) => (v && /^\d+$/.test(v) ? v : undefined)

export function listProjects({ page, pageSize, sort, filters }: ListProjectsParams, signal?: AbortSignal) {
    return api.get<Page<ProjectRow>>("/console/system/projects", {
        signal,
        query: {
            page,
            page_size: pageSize,
            sort: sort?.key,
            dir: sort?.dir,
            q: filters.q,
            comment: filters.comment,
            status: filters.status,
            created_from: unix(filters.created_from),
            created_to: unix(filters.created_to),
        },
    })
}

export function createProject({ name, comment }: CreateProjectValues) {
    return api.post<ProjectRow>("/console/system/projects", { name: name.trim(), comment: comment.trim() })
}

// The project is marked deleted. There is no way back from the console.
export function deleteProject(id: number) {
    return api.delete<null>(`/console/system/projects/${id}`)
}
