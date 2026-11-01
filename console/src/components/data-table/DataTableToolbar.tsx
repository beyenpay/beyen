import { Button } from "@/components/ui/button"
import type { TableParams } from "@/hooks/useTableParams"
import { DataTableFilters } from "./DataTableFilters"
import type { FilterDef, Preset } from "./types"

type Values = Record<string, string>

// Every parameter some chip manages. A chip with no filters of its own ("All")
// clears these and nothing else, so it leaves the panel's filters alone.
function managedKeys(presets: Preset[]) {
    return new Set(presets.flatMap((p) => Object.keys(p.filters)))
}

function isPressed(p: Preset, filters: Values, managed: Set<string>) {
    const keys = Object.keys(p.filters)
    return keys.length === 0
        ? [...managed].every((k) => !filters[k])
        : keys.every((k) => filters[k] === p.filters[k])
}

// Only the chip's own parameters change; the rest of the filters stay.
function applyPreset(p: Preset, filters: Values, managed: Set<string>) {
    const next = { ...filters }
    if (Object.keys(p.filters).length === 0) {
        managed.forEach((k) => delete next[k])
    } else {
        Object.assign(next, p.filters)
    }
    return next
}

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

    const managed = managedKeys(presets ?? [])

    return (
        <div className="flex items-center justify-between gap-3 pb-3">
            <div className="flex min-w-0 gap-2 overflow-x-auto">
                {presets?.map((p) => (
                    <Button
                        key={p.id}
                        variant="outline"
                        size="lg"
                        // A chip is on while its own parameters hold its values.
                        aria-pressed={isPressed(p, params.filters, managed)}
                        className="rounded-md border-border/60 px-4 aria-pressed:border-foreground aria-pressed:ring-1 aria-pressed:ring-inset aria-pressed:ring-foreground"
                        onClick={() => params.setFilters(applyPreset(p, params.filters, managed))}
                    >
                        {p.label}
                    </Button>
                ))}
            </div>
            {filters && filters.length > 0 && <DataTableFilters defs={filters} params={params} />}
        </div>
    )
}
