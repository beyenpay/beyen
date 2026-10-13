import { useQuery } from "@tanstack/react-query"

import { fetchMe } from "@/api/console/auth/me"
import { ApiError } from "@/api/errors"

export const meQueryKey = ["console", "me"] as const

// Resolves to the session, or null when nobody is signed in.
// 401 is the normal state for a visitor, so it is not an error here.
// Other failures stay errors, and are shown by the route guards as a
// full-page state instead of a toast.
export function useMe() {
    return useQuery({
        queryKey: meQueryKey,
        queryFn: async ({ signal }) => {
            try {
                return await fetchMe(signal)
            } catch (error) {
                if (error instanceof ApiError && error.status === 401) {
                    return null
                }
                throw error
            }
        },
        staleTime: 60 * 1000,
        meta: { silent: true },
    })
}