import { ListFilterIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { TableParams } from "@/hooks/useTableParams"
import type { FilterDef, Preset } from "./types"

function sameFilters(a: Record<string, string>, b: Record<string, string>) {
    const keys = Object.keys(a)
    return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
}

function activeCount(defs: FilterDef[], filters: Record<string, string>) {
    return defs.filter((d) =>
        d.type === "dateRange" ? filters[`${d.key}_from`] || filters[`${d.key}_to`] : filters[d.key],
    ).length
}

const SELECT_CLASS =
    "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&_option]:bg-popover [&_option]:text-popover-foreground"

// Left: preset chips. Right: the button that opens every filter.
export function DataTableToolbar({
    params,
    presets,
    filters,
}: {
    params: TableParams
    presets?: Preset[]
    filters?: FilterDef[]
}) {
    if (!presets?.length && !filters?.length) {
        return null
    }

    return (
        <div className="flex items-center justify-between gap-3 pb-3">
            <div className="flex min-w-0 gap-2 overflow-x-auto">
                {presets?.map((p) => (
                    <Button
                        key={p.id}
                        variant="outline"
                        size="sm"
                        // The chip that matches the current filters is the active one.
                        aria-pressed={sameFilters(p.filters, params.filters)}
                        className="aria-pressed:border-foreground aria-pressed:ring-1 aria-pressed:ring-foreground"
                        onClick={() => params.setFilters(p.filters)}
                    >
                        {p.label}
                    </Button>
                ))}
            </div>
            {filters && filters.length > 0 && <FilterPopover defs={filters} params={params} />}
        </div>
    )
}

function FilterPopover({ defs, params }: { defs: FilterDef[]; params: TableParams }) {
    const { t } = useTranslation()
    const count = activeCount(defs, params.filters)

    // Changes one filter and keeps the others.
    const patch = (values: Record<string, string>) =>
        params.setFilters({ ...params.filters, ...values })

    return (
        <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" className="shrink-0" />}>
                <ListFilterIcon />
                {count > 0 ? t("dataTable.filtersActive", { n: count }) : t("dataTable.filters")}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("dataTable.filters")}</span>
                    {count > 0 && (
                        <Button variant="ghost" size="xs" onClick={() => params.setFilters({})}>
                            {t("dataTable.clear")}
                        </Button>
                    )}
                </div>
                {defs.map((def) => (
                    <div key={def.key} className="grid gap-1.5">
                        <label className="text-xs text-muted-foreground" htmlFor={`filter-${def.key}`}>
                            {def.label}
                        </label>
                        <FilterControl def={def} filters={params.filters} onChange={patch} />
                    </div>
                ))}
            </PopoverContent>
        </Popover>
    )
}

// One editor per filter type. A new type is one more case here and one more
// member of FilterDef.
function FilterControl({
    def,
    filters,
    onChange,
}: {
    def: FilterDef
    filters: Record<string, string>
    onChange: (values: Record<string, string>) => void
}) {
    const { t } = useTranslation()
    const id = `filter-${def.key}`

    switch (def.type) {
        case "select":
            return (
                <select
                    id={id}
                    className={SELECT_CLASS}
                    value={filters[def.key] ?? ""}
                    onChange={(e) => onChange({ [def.key]: e.target.value })}
                >
                    <option value="">{t("dataTable.any")}</option>
                    {def.options.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            )
        case "text": {
            // Applied on Enter or when leaving the field, not on every keystroke.
            const commit = (raw: string) => {
                const value = raw.trim()
                if (value !== (filters[def.key] ?? "")) {
                    onChange({ [def.key]: value })
                }
            }
            return (
                <Input
                    id={id}
                    // A new key resets the field when the filter is cleared from outside.
                    key={filters[def.key] ?? ""}
                    defaultValue={filters[def.key] ?? ""}
                    placeholder={def.placeholder}
                    onBlur={(e) => commit(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && commit(e.currentTarget.value)}
                />
            )
        }
        case "dateRange": {
            const from = `${def.key}_from`
            const to = `${def.key}_to`
            return (
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        id={id}
                        type="date"
                        aria-label={t("dataTable.from")}
                        value={filters[from] ?? ""}
                        max={filters[to]}
                        onChange={(e) => onChange({ [from]: e.target.value })}
                    />
                    <Input
                        type="date"
                        aria-label={t("dataTable.to")}
                        value={filters[to] ?? ""}
                        min={filters[from]}
                        onChange={(e) => onChange({ [to]: e.target.value })}
                    />
                </div>
            )
        }
    }
}
