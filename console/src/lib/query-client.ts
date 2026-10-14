import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

import { toast } from "@/components/ui/toast"

import { getErrorMessage } from "./error-message"

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