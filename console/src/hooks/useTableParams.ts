import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

export const PAGE_SIZES = [20, 50, 100] as const

export type TableParams = {
    page: number
    pageSize: number
    // Only the filters that have a value.
    filters: Record<string, string>
    setPage: (page: number) => void
    // Goes back to page 1, since the old page number means something else now.
    setPageSize: (size: number) => void
    // null means the endpoint's own order.
    sort: { key: string; dir: "asc" | "desc" } | null
    // Cycles asc, desc, off for one field, and goes back to page 1.
    toggleSort: (key: string) => void
    // Replaces every filter of this table and goes back to page 1.
    setFilters: (filters: Record<string, string>) => void
}

// Table state lives in the URL (?page=2&status=1), so a reload or a shared
// link shows the same rows. `keys` lists the filter parameters this table owns.
export function useTableParams(keys: string[]): TableParams {
    const [search, setSearch] = useSearchParams()
    // A string, so the hooks below do not depend on the identity of `keys`.
    const keySig = keys.join(",")

    const page = Math.max(1, Math.floor(Number(search.get("page"))) || 1)
    // Anything outside PAGE_SIZES falls back to the first (default) size.
    const sizeParam = Number(search.get("size"))
    const pageSize = PAGE_SIZES.find((s) => s === sizeParam) ?? PAGE_SIZES[0]

    // `?sort=created&dir=asc`. Without a key there is no sort. The endpoint
    // rejects keys it does not know, so a bad URL shows an error, not wrong rows.
    const sortKey = search.get("sort")
    const sortDir = search.get("dir") === "asc" ? "asc" : "desc"
    const sort = useMemo(
        () => (sortKey ? { key: sortKey, dir: sortDir as "asc" | "desc" } : null),
        [sortKey, sortDir],
    )

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

    const setPageSize = useCallback(
        (next: number) => {
            setSearch(
                (prev) => {
                    const p = new URLSearchParams(prev)
                    if (next === PAGE_SIZES[0]) {
                        p.delete("size")
                    } else {
                        p.set("size", String(next))
                    }
                    p.delete("page")
                    return p
                },
                { replace: true },
            )
        },
        [setSearch],
    )

    const toggleSort = useCallback(
        (key: string) => {
            setSearch(
                (prev) => {
                    const p = new URLSearchParams(prev)
                    const same = p.get("sort") === key
                    const dir = p.get("dir") === "asc" ? "asc" : "desc"
                    p.delete("sort")
                    p.delete("dir")
                    // First click: ascending. Second: descending. Third: off.
                    if (!same) {
                        p.set("sort", key)
                        p.set("dir", "asc")
                    } else if (dir === "asc") {
                        p.set("sort", key)
                        p.set("dir", "desc")
                    }
                    p.delete("page")
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

    return { page, pageSize, filters, setPage, setPageSize, sort, toggleSort, setFilters }
}
