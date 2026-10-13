import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import type { ParseKeys } from "i18next"
import { ApiError } from "@/api/errors"
import { toast } from "@/components/ui/toast"
import i18n from "@/i18n"

// Single place to turn an error into a user-facing message.
// Translated by code; an unknown code or a non-ApiError falls back to the
// generic text, never to the raw English message.
function getErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        // The code comes from the server, so the key cannot be checked at compile
        // time. The second entry is the runtime fallback for unknown codes.
        const key = `errors.codes.${error.code}` as ParseKeys
        return i18n.t([key, "errors.fallback"])
    }
    return i18n.t("errors.fallback")
}

export const queryClient = new QueryClient({
    // Global error toast. A query or mutation opts out with `meta: { silent: true }`.
    queryCache: new QueryCache({
        onError: (error, query) => {
            if (query.meta?.silent) {
                return
            }
            toast.add({ type: "error", title: getErrorMessage(error) })
        },
    }),
    mutationCache: new MutationCache({
        onError: (error, _variables, _onMutateResult, mutation) => {
            if (mutation.meta?.silent) {
                return
            }
            toast.add({ type: "error", title: getErrorMessage(error) })
        },
    }),
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})