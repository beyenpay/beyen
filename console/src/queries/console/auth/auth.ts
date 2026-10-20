import { useMutation, useQueryClient } from "@tanstack/react-query"

import { login, logout } from "@/api/console/auth/auth"
import { useProjectStore } from "@/stores/project"

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

export function useLogout() {
    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
            useProjectStore.getState().setCurrentProjectId(null)
            // A full page load, not a client-side redirect: it drops every cached
            // answer of this user at once, and the route guard cannot send the next
            // login back to a page of the previous one.
            window.location.assign("/login")
        },
        // A failure shows the global toast; the user is still signed in and can retry.
    })
}
