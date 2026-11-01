import { useRef, type KeyboardEvent, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export type SegmentedOption<V extends string> = {
    value: V
    label: ReactNode
    disabled?: boolean
}

const SIZES = {
    default: "px-3 py-1 text-sm",
    sm: "px-2.5 py-0.5 text-xs",
}

// Picks one value out of a few, drawn as one pill, e.g. "User | Admin". It is
// a radio group, not tabs: nothing here switches a panel, it only chooses a
// value. Keyboard as the WAI-ARIA radio group asks: Tab enters on the chosen
// option, the arrow keys, Home and End move to the next enabled one and choose it.
export function Segmented<V extends string>({
    value,
    onChange,
    options,
    ariaLabel,
    size = "default",
    fullWidth,
    disabled,
    className,
}: {
    value: V
    onChange: (value: V) => void
    options: SegmentedOption<V>[]
    // Name of the group for screen readers; give it unless a visible label points here.
    ariaLabel?: string
    size?: keyof typeof SIZES
    // The pill spans its container and the options share the width equally.
    fullWidth?: boolean
    disabled?: boolean
    className?: string
}) {
    const buttons = useRef<(HTMLButtonElement | null)[]>([])
    const isDisabled = (o: SegmentedOption<V>) => disabled || o.disabled

    // The one option Tab can reach: the chosen one, or the first enabled when
    // the value is not among the options.
    const chosen = options.find((o) => o.value === value && !isDisabled(o))
    const tabStop = chosen ?? options.find((o) => !isDisabled(o))

    function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
        const count = options.length
        let from = buttons.current.findIndex((b) => b === e.target)
        let step = 1
        switch (e.key) {
            case "ArrowRight":
            case "ArrowDown":
                break
            case "ArrowLeft":
            case "ArrowUp":
                step = -1
                break
            case "Home":
                from = -1
                break
            case "End":
                from = count
                step = -1
                break
            default:
                return
        }
        e.preventDefault()
        // Walks around the ring, skipping disabled options.
        for (let n = 0, i = from; n < count; n++) {
            i = (i + step + count) % count
            if (!isDisabled(options[i])) {
                onChange(options[i].value)
                buttons.current[i]?.focus()
                return
            }
        }
    }

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            aria-disabled={disabled || undefined}
            onKeyDown={onKeyDown}
            className={cn(
                "rounded-lg bg-muted p-0.5",
                fullWidth ? "flex w-full" : "inline-flex w-fit",
                disabled && "opacity-50",
                className,
            )}
        >
            {options.map((o, i) => {
                const checked = o.value === value
                return (
                    <button
                        key={o.value}
                        ref={(el) => {
                            buttons.current[i] = el
                        }}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        disabled={isDisabled(o)}
                        tabIndex={o === tabStop ? 0 : -1}
                        onClick={() => onChange(o.value)}
                        className={cn(
                            "inline-flex items-center justify-center gap-1.5 rounded-md whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                            SIZES[size],
                            fullWidth && "flex-1",
                            checked && "bg-background font-medium text-foreground shadow-xs",
                        )}
                    >
                        {o.label}
                    </button>
                )
            })}
        </div>
    )
}
