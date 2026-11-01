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

export type TextOp = "eq" | "contains"

export type FilterDef =
    // The first of `ops` is the default (default ["eq"]). One op is shown as
    // plain text, several as a menu. URL: `${key}` and `${key}_op`.
    | { type: "text"; key: string; label: string; placeholder?: string; ops?: TextOp[] }
    // One value out of `options`. URL: `${key}`.
    | { type: "select"; key: string; label: string; options: FilterOption[] }
    // Several values out of `options`. URL: `${key}` as `a,b`.
    | { type: "multiSelect"; key: string; label: string; options: FilterOption[] }
    // Always "between", read in the browser's time zone. URL: `${key}_from`
    // and `${key}_to` as unix seconds; the end is inclusive.
    | { type: "dateTime"; key: string; label: string }

// A chip on the left of the toolbar: a named set of filters.
export type Preset = { id: string; label: string; filters: Record<string, string> }

// The URL parameters one filter owns.
export function defKeys(d: FilterDef) {
    switch (d.type) {
        case "text":
            return [d.key, `${d.key}_op`]
        case "dateTime":
            return [`${d.key}_from`, `${d.key}_to`]
        default:
            return [d.key]
    }
}

// The URL parameters behind a list of filters, for useTableParams.
export function filterKeys(defs: FilterDef[]) {
    return defs.flatMap(defKeys)
}
