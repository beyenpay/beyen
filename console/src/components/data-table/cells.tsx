import { CheckIcon, CopyIcon } from "lucide-react"
import { Fragment, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { copyText } from "@/lib/clipboard"
import { cn } from "@/lib/utils"
import type { DetailItem } from "./types"

// One line, cut off with an ellipsis. The full text shows on hover, but only
// when something was actually cut off.
export function TruncatedText({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    // Typed as the trigger's own element type; at runtime it is the <span> below.
    const ref = useRef<HTMLButtonElement>(null)

    return (
        <Tooltip
            onOpenChange={(open, details) => {
                const el = ref.current
                if (open && el && el.scrollWidth <= el.clientWidth) {
                    details.cancel()
                }
            }}
        >
            <TooltipTrigger
                ref={ref}
                render={<span className={cn("block min-w-0 truncate", className)} />}
            >
                {children}
            </TooltipTrigger>
            <TooltipContent className="break-all">{children}</TooltipContent>
        </Tooltip>
    )
}

// Text with a copy button beside it, for IDs, keys and hashes. A click copies
// the value and shows a check mark for a moment.
export function CopyText({
    value,
    mono = true,
    label,
}: {
    value: string
    mono?: boolean
    // The toast text; defaults to a generic "Copied".
    label?: string
}) {
    const { t } = useTranslation()
    const [done, setDone] = useState(false)

    async function copy() {
        if (await copyText(value, label ?? t("dataTable.copied"))) {
            setDone(true)
            setTimeout(() => setDone(false), 1500)
        }
    }

    return (
        <span className="flex min-w-0 items-center gap-1.5">
            <TruncatedText className={cn(mono && "font-mono text-[0.8rem]")}>{value}</TruncatedText>
            <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-muted-foreground"
                aria-label={t("dataTable.copy")}
                onClick={() => void copy()}
            >
                {done ? <CheckIcon /> : <CopyIcon />}
            </Button>
        </span>
    )
}

// Label/value rows for the content of a detail dialog.
export function DetailList({ items }: { items: DetailItem[] }) {
    return (
        <dl className="grid grid-cols-[fit-content(9rem)_minmax(0,1fr)] items-baseline gap-x-6 gap-y-2.5 text-sm">
            {items.map((item, i) => (
                <Fragment key={i}>
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="min-w-0 break-words">{item.value}</dd>
                </Fragment>
            ))}
        </dl>
    )
}
