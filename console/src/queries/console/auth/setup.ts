import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { fetchSetupStatus, setupAdmin } from "@/api/console/auth/setup"

export const setupStatusQueryKey = ["console", "setup-status"] as const

export function useSetupStatus() {
    return useQuery({
        queryKey: setupStatusQueryKey,
        queryFn: ({ signal }) => fetchSetupStatus(signal),
        staleTime: 60 * 1000,
        // A failure is shown by SetupGate as a full-page state, not a toast.
        meta: { silent: true },
    })
}

export function useSetup() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: setupAdmin,
        // Returning the promise keeps the mutation pending until the status is
        // fresh; SetupGate then sees needs_setup=false and moves on to /login.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: setupStatusQueryKey }),
        // The setup page shows its own error next to the form, not a toast.
        meta: { silent: true },
    })
}
