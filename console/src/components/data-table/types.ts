import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export type RowKey = string | number

export type Column<T> = {
    id: string
    header: ReactNode
    // A small "?" next to the header; hovering it explains the column.
    hint?: ReactNode
    // A string or number is cut off with an ellipsis and gets a hover tooltip
    // by itself. Return a component (CopyText, UserStatusBadge, ...) for anything richer.
    cell: (row: T) => ReactNode
    // Pixels. Pick a width that fits a typical value; longer values are cut off.
    // A column without one shares whatever room is left.
    width?: number
    align?: "left" | "right"
}

export type RowAction<T> = {
    id: string
    label: string
    icon?: LucideIcon
    // Heading of the menu section. Actions with the same group sit together.
    group?: string
    // Also shown as an icon button on the hovered row (needs an icon).
    inline?: boolean
    destructive?: boolean
    hidden?: (row: T) => boolean
    onSelect: (row: T) => void
}

export type BulkAction<T> = {
    id: string
    label: string
    icon?: LucideIcon
    destructive?: boolean
    // clear() empties the selection, e.g. after the action went through.
    onSelect: (rows: T[], clear: () => void) => void
}

export type FilterOption = { value: string; label: string }

export type FilterDef =
    | { type: "text"; key: string; label: string; placeholder?: string }
    | { type: "select"; key: string; label: string; options: FilterOption[] }
    // Uses two URL parameters, `${key}_from` and `${key}_to`, as YYYY-MM-DD.
    | { type: "dateRange"; key: string; label: string }

// A chip on the left of the toolbar: a named set of filters.
export type Preset = { id: string; label: string; filters: Record<string, string> }

// The URL parameters behind a list of filters, for useTableParams.
export function filterKeys(defs: FilterDef[]) {
    return defs.flatMap((d) =>
        d.type === "dateRange" ? [`${d.key}_from`, `${d.key}_to`] : [d.key],
    )
}
