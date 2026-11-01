import type { ComponentProps } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Colors on top of shadcn's Badge, named by meaning. A new color is one more
// line here; Badge itself stays as shadcn generated it.
const TONES = {
    gray: "bg-beyen-oai-badge-gray text-beyen-oai-badge-gray-foreground",
    green: "bg-beyen-oai-badge-green text-beyen-oai-badge-green-foreground",
    blue: "bg-beyen-oai-badge-blue text-beyen-oai-badge-blue-foreground",
    red: "bg-beyen-oai-badge-red text-beyen-oai-badge-red-foreground",
    purple: "bg-beyen-oai-badge-purple text-beyen-oai-badge-purple-foreground",
}

export type Tone = keyof typeof TONES

export function ToneBadge({
    tone = "gray",
    className,
    ...props
}: Omit<ComponentProps<typeof Badge>, "variant"> & { tone?: Tone }) {
    return (
        <Badge variant="secondary" className={cn(TONES[tone], className)} {...props} />
    )
}