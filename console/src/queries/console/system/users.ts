import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    createUser,
    deleteUser,
    listUsers,
    resetUserPassword,
    restoreUser,
    updateUser,
    type ListUsersParams,
    type UserPatch,
} from "@/api/console/system/users"

const usersQueryKey = ["console", "system", "users"] as const

export function useUsers(params: ListUsersParams) {
    return useQuery({
        queryKey: [...usersQueryKey, params],
        queryFn: ({ signal }) => listUsers(params, signal),
        // Paging keeps the old rows on screen until the next page arrives.
        placeholderData: keepPreviousData,
        // The table shows the error itself, with a retry button.
        meta: { silent: true },
    })
}

// Every change below refreshes the list. Returning the promise keeps the
// mutation pending until the list is fresh, so a dialog closes onto a table
// that already shows the result. The dialogs show errors next to their form,
// hence silent; restore has no dialog, so its errors reach the global toast.
function useRefreshUsers() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: usersQueryKey })
}

export function useCreateUser() {
    const refresh = useRefreshUsers()
    return useMutation({
        mutationFn: createUser,
        onSuccess: refresh,
        meta: { silent: true },
    })
}

// Saves the edit form: the changed fields, then the new password if one was
// given. The two are separate calls, so the list is refreshed after either
// outcome: when the second fails, the first has already happened.
export function useSaveUser() {
    const refresh = useRefreshUsers()
    return useMutation({
        mutationFn: async ({ id, patch, password }: { id: number; patch: UserPatch; password?: string }) => {
            if (Object.keys(patch).length > 0) {
                await updateUser(id, patch)
            }
            if (password) {
                await resetUserPassword(id, password)
            }
        },
        onSettled: refresh,
        meta: { silent: true },
    })
}

export function useDeleteUser() {
    const refresh = useRefreshUsers()
    return useMutation({
        mutationFn: deleteUser,
        onSettled: refresh, // also on failure: a stale row is often why it failed
        meta: { silent: true },
    })
}

export function useRestoreUser() {
    const refresh = useRefreshUsers()
    return useMutation({
        mutationFn: restoreUser,
        onSettled: refresh,
    })
}
