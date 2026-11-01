import type { TFunction } from "i18next"
import { ChevronLeftIcon, ChevronsUpDownIcon, ListFilterIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { zhCN } from "react-day-picker/locale"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { TableParams } from "@/hooks/useTableParams"
import { cn } from "@/lib/utils"
import { formatDay, momentToUnix, unixToMoment, type Moment } from "./filterValue"
import { defKeys, type FilterDef, type FilterOption, type TextOp } from "./types"

type Values = Record<string, string>

// Literal keys, so the translation keys stay type-checked.
const opLabel = (t: TFunction, op: TextOp) =>
    op === "contains" ? t("dataTable.ops.contains") : t("dataTable.ops.eq")
function isActive(def: FilterDef, filters: Values) {
    return def.type === "dateTime"
        ? !!(filters[`${def.key}_from`] || filters[`${def.key}_to`])
        : !!filters[def.key]
}

// The text of the chip beside a filter's name; null while the filter is unset.
function describe(def: FilterDef, filters: Values, t: TFunction): string | null {
    switch (def.type) {
        case "text": {
            const value = filters[def.key]
            if (!value) {
                return null
            }
            const op = (filters[`${def.key}_op`] as TextOp | undefined) ?? def.ops?.[0] ?? "eq"
            return `${opLabel(t, op)} ${value}`
        }
        case "select": {
            const value = filters[def.key]
            return value ? (def.options.find((o) => o.value === value)?.label ?? value) : null
        }
        case "multiSelect": {
            const value = filters[def.key]
            if (!value) {
                return null
            }
            return value
                .split(",")
                .map((v) => def.options.find((o) => o.value === v)?.label ?? v)
                .join(", ")
        }
        case "dateTime": {
            const from = Number(filters[`${def.key}_from`])
            const to = Number(filters[`${def.key}_to`])
            if (!from && !to) {
                return null
            }
            return `${from ? formatDay(unixToMoment(from).day) : ""} – ${to ? formatDay(unixToMoment(to).day) : ""}`
        }
    }
}

// The button in the toolbar and the two-level panel behind it: a list of
// filters, and the editor of the one that was picked.
export function DataTableFilters({ defs, params }: { defs: FilterDef[]; params: TableParams }) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    // The key of the filter being edited; null shows the list.
    const [editing, setEditing] = useState<string | null>(null)

    const count = defs.filter((d) => isActive(d, params.filters)).length
    const def = defs.find((d) => d.key === editing)

    // Merges into the current filters; a "" value removes that parameter.
    const patch = (values: Values) => params.setFilters({ ...params.filters, ...values })
    const clear = (d: FilterDef) => patch(Object.fromEntries(defKeys(d).map((k) => [k, ""])))

    return (
        <Popover
            open={open}
            onOpenChange={(next: boolean) => {
                setOpen(next)
                if (!next) {
                    setEditing(null)
                }
            }}
        >
            <PopoverTrigger render={<Button variant="outline" size="lg" className="shrink-0" />}>
                <ListFilterIcon />
                {count > 0 ? t("dataTable.filtersActive", { n: count }) : t("dataTable.filters")}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 gap-0 px-0 pt-3 pb-2">
                {def ? (
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 px-3">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon-sm"
                                aria-label={t("dataTable.back")}
                                onClick={() => setEditing(null)}
                            >
                                <ChevronLeftIcon />
                            </Button>
                            <span className="min-w-0 truncate text-sm font-medium">{def.label}</span>
                        </div>
                        <FilterEditor
                            key={def.key}
                            def={def}
                            filters={params.filters}
                            onApply={(values) => {
                                patch(values)
                                setEditing(null)
                            }}
                        />
                    </div>
                ) : (
                    <>
                        <span className="px-4 pb-2 text-sm font-medium">{t("dataTable.filters")}</span>
                        {/* minmax(0, 1fr): a long chip is cut off inside the row instead of widening the column. */}
                        <div className="grid grid-cols-[minmax(0,1fr)]">
                            {defs.map((d) => (
                                <FilterRow
                                    key={d.key}
                                    def={d}
                                    filters={params.filters}
                                    onOpen={() => setEditing(d.key)}
                                    onClear={() => clear(d)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    )
}

function FilterRow({
    def,
    filters,
    onOpen,
    onClear,
}: {
    def: FilterDef
    filters: Values
    onOpen: () => void
    onClear: () => void
}) {
    const { t } = useTranslation()
    const text = describe(def, filters, t)

    // Not a <button>: the chip holds a button of its own.
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    onOpen()
                }
            }}
            className="flex min-h-9 min-w-0 cursor-pointer items-center justify-between gap-3 px-4 text-sm outline-none hover:bg-muted focus-visible:bg-muted"
        >
            <span className="max-w-28 shrink-0 truncate">{def.label}</span>
            {text && (
                <span
                    title={text}
                    className="flex min-w-0 items-center gap-1 rounded-full border bg-background py-0.5 pr-1 pl-2.5 text-xs font-medium"
                >
                    <span className="truncate">{text}</span>
                    <button
                        type="button"
                        aria-label={t("dataTable.clear")}
                        className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                            e.stopPropagation()
                            onClear()
                        }}
                    >
                        <XIcon className="size-3" />
                    </button>
                </span>
            )}
        </div>
    )
}

type EditorProps<D extends FilterDef> = {
    def: D
    filters: Values
    onApply: (values: Values) => void
}

// One editor per filter type. A new type is one more case here, one more
// member of FilterDef, and one more case in describe() and defKeys().
function FilterEditor({ def, filters, onApply }: EditorProps<FilterDef>) {
    switch (def.type) {
        case "text":
            return <TextEditor def={def} filters={filters} onApply={onApply} />
        case "select":
            return <SelectEditor def={def} filters={filters} onApply={onApply} />
        case "multiSelect":
            return <MultiEditor def={def} filters={filters} onApply={onApply} />
        case "dateTime":
            return <DateTimeEditor def={def} filters={filters} onApply={onApply} />
    }
}

function TextEditor({ def, filters, onApply }: EditorProps<Extract<FilterDef, { type: "text" }>>) {
    const { t } = useTranslation()
    const ops = def.ops ?? ["eq"]
    const saved = filters[`${def.key}_op`] as TextOp | undefined
    const [op, setOp] = useState<TextOp>(saved && ops.includes(saved) ? saved : ops[0])
    const [value, setValue] = useState(filters[def.key] ?? "")
    const text = value.trim()

    // An empty box clears the filter.
    const apply = () => onApply({ [def.key]: text, [`${def.key}_op`]: text ? op : "" })

    return (
        <>
            <div className="flex items-center gap-2">
                {ops.length > 1 ? (
                    <SelectField
                        className="w-28 shrink-0"
                        value={op}
                        onChange={(v) => setOp(v as TextOp)}
                        options={ops.map((o) => ({ value: o, label: opLabel(t, o) }))}
                    />
                ) : (
                    <span className="shrink-0 text-sm text-muted-foreground">{opLabel(t, op)}</span>
                )}
                <Input
                    autoFocus
                    value={value}
                    placeholder={def.placeholder}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && apply()}
                />
            </div>
            <Button onClick={apply}>{t("dataTable.apply")}</Button>
        </>
    )
}

function SelectEditor({ def, filters, onApply }: EditorProps<Extract<FilterDef, { type: "select" }>>) {
    const { t } = useTranslation()
    const saved = filters[def.key]
    // No "any" entry: a filter is removed from the list instead. Start on the saved value or the first option.
    const [value, setValue] = useState(
        def.options.some((o) => o.value === saved) ? saved : (def.options[0]?.value ?? ""),
    )

    return (
        <>
            <SelectField value={value} onChange={setValue} options={def.options} />
            <Button onClick={() => onApply({ [def.key]: value })}>{t("dataTable.apply")}</Button>
        </>
    )
}

function MultiEditor({ def, filters, onApply }: EditorProps<Extract<FilterDef, { type: "multiSelect" }>>) {
    const { t } = useTranslation()
    const [picked, setPicked] = useState(
        () => new Set((filters[def.key] ?? "").split(",").filter(Boolean)),
    )

    const toggle = (v: string) =>
        setPicked((prev) => {
            const next = new Set(prev)
            if (!next.delete(v)) {
                next.add(v)
            }
            return next
        })

    return (
        <>
            <div className="grid max-h-60 gap-0.5 overflow-y-auto">
                {def.options.map((o) => (
                    <label
                        key={o.value}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                        <Checkbox checked={picked.has(o.value)} onCheckedChange={() => toggle(o.value)} />
                        {o.label}
                    </label>
                ))}
            </div>
            <Button
                // In the order of the options, so the URL does not depend on the click order.
                onClick={() =>
                    onApply({
                        [def.key]: def.options
                            .filter((o) => picked.has(o.value))
                            .map((o) => o.value)
                            .join(","),
                    })
                }
            >
                {t("dataTable.apply")}
            </Button>
        </>
    )
}

function DateTimeEditor({ def, filters, onApply }: EditorProps<Extract<FilterDef, { type: "dateTime" }>>) {
    const { t } = useTranslation()
    const [range, setRange] = useState<{ start: Moment; end: Moment }>(() => {
        const from = Number(filters[`${def.key}_from`])
        const to = Number(filters[`${def.key}_to`])
        const today = unixToMoment(Date.now() / 1000).day
        return {
            start: from ? unixToMoment(from) : { day: today, time: "00:00" },
            end: to ? unixToMoment(to) : { day: today, time: "23:59" },
        }
    })

    const from = momentToUnix(range.start)
    // The end minute counts in full.
    const to = momentToUnix(range.end) + 59
    const valid = Number.isFinite(from) && Number.isFinite(to) && from <= to

    return (
        <>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-2">
                <MomentField
                    label={t("dataTable.startAt")}
                    value={range.start}
                    onChange={(start) => setRange((r) => ({ ...r, start }))}
                />
                <MomentField
                    label={t("dataTable.endAt")}
                    value={range.end}
                    onChange={(end) => setRange((r) => ({ ...r, end }))}
                />
            </div>
            {!valid && <p className="text-xs text-destructive">{t("dataTable.rangeInvalid")}</p>}
            <Button
                disabled={!valid}
                onClick={() =>
                    onApply({
                        [`${def.key}_from`]: String(from),
                        [`${def.key}_to`]: String(to),
                    })
                }
            >
                {t("dataTable.apply")}
            </Button>
        </>
    )
}

// One row of the date editor: label, day picker, time box.
function MomentField({
    label,
    value,
    onChange,
}: {
    label: string
    value: Moment
    onChange: (value: Moment) => void
}) {
    const { i18n } = useTranslation()
    const [open, setOpen] = useState(false)

    return (
        <>
            <span className="text-sm text-muted-foreground">{label}</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                    render={<Button variant="outline" className="justify-start font-normal" />}
                >
                    {formatDay(value.day)}
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={value.day}
                        defaultMonth={value.day}
                        locale={i18n.language.startsWith("zh") ? zhCN : undefined}
                        onSelect={(day) => {
                            if (day) {
                                onChange({ ...value, day })
                                setOpen(false)
                            }
                        }}
                    />
                </PopoverContent>
            </Popover>
            <Input
                type="time"
                className="w-28"
                value={value.time}
                onChange={(e) => onChange({ ...value, time: e.target.value })}
            />
        </>
    )
}

// A select box: the current label and chevrons, a menu with a check mark on the chosen item.
function SelectField({
    value,
    options,
    onChange,
    className,
}: {
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
    className?: string
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button variant="outline" className={cn("w-full justify-between font-normal", className)} />}
            >
                <span className="truncate">{options.find((o) => o.value === value)?.label}</span>
                <ChevronsUpDownIcon className="text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-(--anchor-width)">
                <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                    {options.map((o) => (
                        <DropdownMenuRadioItem key={o.value} value={o.value} closeOnClick>
                            {o.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
