import { InfoIcon, MoreHorizontalIcon, XIcon } from "lucide-react"
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { TableParams } from "@/hooks/useTableParams"
import { cn } from "@/lib/utils"
import { TruncatedText } from "./cells"
import { DataTablePagination } from "./DataTablePagination"
import { DataTableToolbar } from "./DataTableToolbar"
import type { BulkAction, Column, FilterDef, Preset, RowAction, RowKey } from "./types"

export type DataTableProps<T> = {
    columns: Column<T>[]
    rows: T[]
    rowKey: (row: T) => RowKey
    total: number
    params: TableParams
    isLoading?: boolean // nothing to show yet
    isFetching?: boolean // reloading behind the rows already on screen
    isError?: boolean
    onRetry?: () => void
    presets?: Preset[]
    filters?: FilterDef[]
    // Icon buttons on the hovered row, and the "..." menu.
    rowActions?: RowAction<T>[]
    // Giving some adds the checkboxes and the floating bar.
    bulkActions?: BulkAction<T>[]
    // Giving it makes rows clickable; the returned content fills a dialog.
    renderDetail?: (row: T, close: () => void) => ReactNode
}

const NO_SELECTION = new Set<RowKey>()

// Clicks that belong to a control inside the row, not to the row itself.
const INTERACTIVE = "button, a, input, [role=checkbox], [role=menu], [role=menuitem]"

function isInteractive(target: EventTarget) {
    return target instanceof Element && target.closest(INTERACTIVE) !== null
}

// Strings and numbers get the truncate-with-tooltip treatment; anything else
// is the page's own component and is left alone.
function renderCell(node: ReactNode) {
    return typeof node === "string" || typeof node === "number" ? (
        <TruncatedText>{node}</TruncatedText>
    ) : (
        node
    )
}

export function DataTable<T>({
    columns,
    rows,
    rowKey,
    total,
    params,
    isLoading,
    isFetching,
    isError,
    onRetry,
    presets,
    filters,
    rowActions,
    bulkActions,
    renderDetail,
}: DataTableProps<T>) {
    const { t } = useTranslation()
    const [detail, setDetail] = useState<{ row: T } | null>(null)

    // True while the table is cut off on the right, to show the fade there.
    const wrapRef = useRef<HTMLDivElement>(null)
    const [moreRight, setMoreRight] = useState(false)
    useEffect(() => {
        const scroller = wrapRef.current?.querySelector<HTMLElement>("[data-slot=table-container]")
        if (!scroller) {
            return
        }
        const update = () =>
            setMoreRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1)
        update()
        scroller.addEventListener("scroll", update, { passive: true })
        // Both the box and the table inside it: either one changing size changes the answer.
        const observer = new ResizeObserver(update)
        observer.observe(scroller)
        if (scroller.firstElementChild) {
            observer.observe(scroller.firstElementChild)
        }
        return () => {
            scroller.removeEventListener("scroll", update)
            observer.disconnect()
        }
    }, [])

    // The selection belongs to one page of one filter set; once either changes
    // it counts as empty, so no effect is needed to reset it.
    const scope = `${params.page}|${JSON.stringify(params.filters)}`
    const [selection, setSelection] = useState({ scope, keys: NO_SELECTION })
    const selected = selection.scope === scope ? selection.keys : NO_SELECTION
    const select = (keys: Set<RowKey>) => setSelection({ scope, keys })

    const selectable = !!bulkActions?.length
    const hasRowActions = !!rowActions?.length
    const selectedRows = rows.filter((r) => selected.has(rowKey(r)))
    const allSelected = rows.length > 0 && selectedRows.length === rows.length

    const colCount = columns.length + (selectable ? 1 : 0) + (hasRowActions ? 1 : 0)
    const minWidth = columns.reduce((sum, c) => sum + (c.width ?? 160), selectable ? 44 : 0)

    function toggleRow(key: RowKey) {
        const next = new Set(selected)
        if (!next.delete(key)) {
            next.add(key)
        }
        select(next)
    }

    return (
        <div className="flex min-h-full flex-col">
            <DataTableToolbar params={params} presets={presets} filters={filters} />

            <div
                ref={wrapRef}
                className={cn("relative flex-1", isFetching && !isLoading && "opacity-60 transition-opacity")}
            >
                <Table className="table-fixed" style={{ minWidth }}>
                    <colgroup>
                        {selectable && <col style={{ width: 44 }} />}
                        {columns.map((c) => (
                            <col key={c.id} style={c.width ? { width: c.width } : undefined} />
                        ))}
                        {hasRowActions && <col style={{ width: 1 }} />}
                    </colgroup>
                    <TableHeader className="[&_tr]:border-b-0">
                        <TableRow>
                            {selectable && (
                                <TableHead className="h-8">
                                    <Checkbox
                                        aria-label={t("dataTable.selectAll")}
                                        checked={allSelected}
                                        indeterminate={!allSelected && selectedRows.length > 0}
                                        onCheckedChange={() =>
                                            select(allSelected ? new Set() : new Set(rows.map(rowKey)))
                                        }
                                    />
                                </TableHead>
                            )}
                            {columns.map((c) => (
                                <TableHead
                                    key={c.id}
                                    className={cn(
                                        "h-8 overflow-hidden text-xs font-normal text-muted-foreground",
                                        c.align === "right" && "text-right",
                                    )}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {c.header}
                                        {c.hint && <ColumnHint>{c.hint}</ColumnHint>}
                                    </span>
                                </TableHead>
                            ))}
                            {hasRowActions && <TableHead className="h-8" />}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <StateRow colSpan={colCount}>{t("dataTable.loading")}</StateRow>
                        ) : isError && rows.length === 0 ? (
                            <StateRow colSpan={colCount}>
                                <p>{t("dataTable.error")}</p>
                                {onRetry && (
                                    <Button variant="outline" size="sm" onClick={onRetry}>
                                        {t("dataTable.retry")}
                                    </Button>
                                )}
                            </StateRow>
                        ) : rows.length === 0 ? (
                            <StateRow colSpan={colCount}>
                                <p>{t("dataTable.empty")}</p>
                                {Object.keys(params.filters).length > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => params.setFilters({})}>
                                        {t("dataTable.clear")}
                                    </Button>
                                )}
                            </StateRow>
                        ) : (
                            rows.map((row) => {
                                const key = rowKey(row)
                                const checked = selected.has(key)
                                return (
                                    <TableRow
                                        key={key}
                                        data-state={checked ? "selected" : undefined}
                                        className={cn("group/row", renderDetail && "cursor-pointer")}
                                        tabIndex={renderDetail ? 0 : undefined}
                                        onClick={
                                            renderDetail
                                                ? (e) => {
                                                    if (!isInteractive(e.target)) {
                                                        setDetail({ row })
                                                    }
                                                }
                                                : undefined
                                        }
                                        onKeyDown={
                                            renderDetail
                                                ? (e) => {
                                                    if (e.key === "Enter" && e.target === e.currentTarget) {
                                                        setDetail({ row })
                                                    }
                                                }
                                                : undefined
                                        }
                                    >
                                        {selectable && (
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    aria-label={t("dataTable.selectRow")}
                                                    checked={checked}
                                                    onCheckedChange={() => toggleRow(key)}
                                                />
                                            </TableCell>
                                        )}
                                        {columns.map((c) => (
                                            <TableCell
                                                key={c.id}
                                                className={cn("overflow-hidden", c.align === "right" && "text-right")}
                                            >
                                                {renderCell(c.cell(row))}
                                            </TableCell>
                                        ))}
                                        {hasRowActions && (
                                            <TableCell className="sticky right-0 z-10 p-0" onClick={(e) => e.stopPropagation()}>
                                                <RowActions row={row} actions={rowActions} />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Fades the right edge while more columns are scrolled out of sight. */}
                <div
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-beyen-console-surface to-transparent transition-opacity",
                        moreRight ? "opacity-100" : "opacity-0",
                    )}
                />
            </div>

            <DataTablePagination params={params} total={total} />

            {bulkActions && selectedRows.length > 0 && (
                // Zero height and sticky: the bar floats above the pagination without taking room.
                <div className="sticky bottom-16 z-20 h-0">
                    <div className="absolute bottom-0 left-1/2 flex min-w-md -translate-x-1/2 items-center justify-between gap-6 rounded-sm bg-foreground py-2 pr-2 pl-4 text-sm text-background shadow-lg">
                        <span className="whitespace-nowrap">
                            {t("dataTable.selected", { n: selectedRows.length })}
                        </span>
                        <div className="flex items-center gap-1">
                            {bulkActions.map((a) => (
                                <Button
                                    key={a.id}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "text-background hover:bg-background/15 hover:text-background dark:hover:bg-background/15",
                                        a.destructive && "text-red-400 hover:text-red-400",
                                    )}
                                    onClick={() => a.onSelect(selectedRows, () => select(new Set()))}
                                >
                                    {a.icon && <a.icon />}
                                    {a.label}
                                </Button>
                            ))}
                            <span className="mx-1 h-5 w-px bg-background/25" />
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-background hover:bg-background/15 hover:text-background dark:hover:bg-background/15"
                                aria-label={t("dataTable.clearSelection")}
                                onClick={() => select(new Set())}
                            >
                                <XIcon />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {renderDetail && (
                <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
                    <DialogContent className="sm:max-w-lg">
                        {detail && renderDetail(detail.row, () => setDetail(null))}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

function StateRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="h-48 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">{children}</div>
            </TableCell>
        </TableRow>
    )
}

function ColumnHint({ children }: { children: ReactNode }) {
    return (
        <Tooltip>
            <TooltipTrigger className="inline-flex cursor-default text-muted-foreground/70 hover:text-muted-foreground">
                <InfoIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>{children}</TooltipContent>
        </Tooltip>
    )
}

// Floats over the right end of the hovered row. Stays visible while the menu
// is open or something inside has keyboard focus.
function RowActions<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
    const { t } = useTranslation()
    const visible = actions.filter((a) => !a.hidden?.(row))
    if (visible.length === 0) {
        return null
    }

    // Menu sections, in the order their group first appears.
    const groups = new Map<string, RowAction<T>[]>()
    for (const a of visible) {
        const name = a.group ?? ""
        groups.set(name, [...(groups.get(name) ?? []), a])
    }

    return (
        <div className="absolute top-1/2 right-2 z-10 flex -translate-y-1/2 items-center gap-0.5 rounded-sm border bg-background p-0.5 opacity-0 shadow-xs transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 has-aria-expanded:opacity-100">
            {visible
                .filter((a) => a.inline && a.icon)
                .map((a) => (
                    <Tooltip key={a.id}>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={a.label}
                                    onClick={() => a.onSelect(row)}
                                />
                            }
                        >
                            {a.icon && <a.icon />}
                        </TooltipTrigger>
                        <TooltipContent>{a.label}</TooltipContent>
                    </Tooltip>
                ))}
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button variant="ghost" size="icon-sm" aria-label={t("dataTable.moreActions")} />
                    }
                >
                    <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {[...groups].map(([name, items], i) => (
                        <Fragment key={name}>
                            {i > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuGroup>
                                {name && <DropdownMenuLabel>{name}</DropdownMenuLabel>}
                                {items.map((a) => (
                                    <DropdownMenuItem
                                        key={a.id}
                                        variant={a.destructive ? "destructive" : "default"}
                                        onClick={() => a.onSelect(row)}
                                        className="h-8"
                                    >
                                        {a.icon && <a.icon />}
                                        {a.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                        </Fragment>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
