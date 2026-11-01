import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

export type TableParams = {
    page: number
    pageSize: number
    // Only the filters that have a value.
    filters: Record<string, string>
    setPage: (page: number) => void
    // Replaces every filter of this table and goes back to page 1.
    setFilters: (filters: Record<string, string>) => void
}

// Table state lives in the URL (?page=2&status=1), so a reload or a shared
// link shows the same rows. `keys` lists the filter parameters this table owns.
export function useTableParams(keys: string[], pageSize = 20): TableParams {
    const [search, setSearch] = useSearchParams()
    // A string, so the hooks below do not depend on the identity of `keys`.
    const keySig = keys.join(",")

    const page = Math.max(1, Math.floor(Number(search.get("page"))) || 1)

    const filters = useMemo(() => {
        const out: Record<string, string> = {}
        for (const key of keySig.split(",")) {
            const value = search.get(key)
            if (value) {
                out[key] = value
            }
        }
        return out
    }, [search, keySig])

    // replace: true, so filtering does not fill the history with every click.
    const setPage = useCallback(
        (next: number) => {
            setSearch(
                (prev) => {
                    const p = new URLSearchParams(prev)
                    if (next <= 1) {
                        p.delete("page")
                    } else {
                        p.set("page", String(next))
                    }
                    return p
                },
                { replace: true },
            )
        },
        [setSearch],
    )

    const setFilters = useCallback(
        (next: Record<string, string>) => {
            setSearch(
                (prev) => {
                    const p = new URLSearchParams(prev)
                    for (const key of keySig.split(",")) {
                        p.delete(key)
                    }
                    for (const [key, value] of Object.entries(next)) {
                        if (value) {
                            p.set(key, value)
                        }
                    }
                    p.delete("page")
                    return p
                },
                { replace: true },
            )
        },
        [setSearch, keySig],
    )

    return { page, pageSize, filters, setPage, setFilters }
}
