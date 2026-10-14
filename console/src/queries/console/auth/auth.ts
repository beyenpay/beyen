import { useMutation, useQueryClient } from "@tanstack/react-query"

import { login } from "@/api/console/auth/auth"

import { meQueryKey } from "./me"

export function useLogin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: login,
        // Returning the promise keeps the mutation pending until /me is fresh,
        // so the guard sees the session and moves on without a flash of the form.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: meQueryKey }),
        // The login page shows its own error next to the form, not a toast.
        meta: { silent: true },
    })
}
