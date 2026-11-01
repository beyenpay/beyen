import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { ThemeProvider } from "./ThemeProvider"
import { queryClient } from "@/lib/query-client"

import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"

// How long the pointer rests on something before its tooltip shows, for the
// whole app. Change it here and nowhere else.
const TOOLTIP_DELAY = 100

export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <TooltipProvider delay={TOOLTIP_DELAY}>
                    {children}
                    <Toaster />
                </TooltipProvider>
            </ThemeProvider>
        </QueryClientProvider>
    )
}