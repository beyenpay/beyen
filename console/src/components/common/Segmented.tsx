import { cn } from "@/lib/utils"

// A row of mutually exclusive choices drawn as one pill, e.g. "User | Admin".
export function Segmented<V extends string>({
    value,
    onChange,
    options,
    ariaLabel,
}: {
    value: V
    onChange: (value: V) => void
    options: { value: V; label: string }[]
    ariaLabel?: string
}) {
    return (
        <div role="radiogroup" aria-label={ariaLabel} className="inline-flex w-fit rounded-lg bg-muted p-0.5">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={o.value === value}
                    onClick={() => onChange(o.value)}
                    className={cn(
                        "rounded-md px-3 py-1 text-sm text-muted-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        o.value === value && "bg-background font-medium text-foreground shadow-xs",
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    )
}
