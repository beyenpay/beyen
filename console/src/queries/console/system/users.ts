import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createUser, listUsers, type ListUsersParams } from "@/api/console/system/users"

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

export function useCreateUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createUser,
        // Returning the promise keeps the mutation pending until the list is
        // fresh, so the dialog closes onto a table that already has the new row.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey }),
        // The dialog shows its own error next to the form, not a toast.
        meta: { silent: true },
    })
}
