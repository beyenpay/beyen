import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    createProject,
    deleteProject,
    listProjects,
    type ListProjectsParams,
} from "@/api/console/system/projects"
import { meQueryKey } from "@/queries/console/auth/me"

const projectsQueryKey = ["console", "system", "projects"] as const

export function useProjects(params: ListProjectsParams) {
    return useQuery({
        queryKey: [...projectsQueryKey, params],
        queryFn: ({ signal }) => listProjects(params, signal),
        // Paging keeps the old rows on screen until the next page arrives.
        placeholderData: keepPreviousData,
        // The table shows the error itself, with a retry button.
        meta: { silent: true },
    })
}

// A project change also changes the project list of /me (the sidebar's project
// switcher), so both are refreshed. Returning the promise keeps the mutation
// pending until the table is fresh, so a dialog closes onto the new state.
function useRefreshProjects() {
    const queryClient = useQueryClient()
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
            queryClient.invalidateQueries({ queryKey: meQueryKey }),
        ])
}

// The dialogs show their errors next to the form, hence silent.
export function useCreateProject() {
    const refresh = useRefreshProjects()
    return useMutation({
        mutationFn: createProject,
        onSuccess: refresh,
        meta: { silent: true },
    })
}

export function useDeleteProject() {
    const refresh = useRefreshProjects()
    return useMutation({
        mutationFn: deleteProject,
        onSettled: refresh, // also on failure: a stale row is often why it failed
        meta: { silent: true },
    })
}
