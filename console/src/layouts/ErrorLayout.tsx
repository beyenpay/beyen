import type { ReactNode } from "react"
import { SiteHeader } from "./_components/site/SiteHeader"
import { SiteFooter } from "./_components/site/SiteFooter"
import { useEmbedded } from "./embedded"


type ErrorLayoutProps = {
    code?: string
    title: string
    description: string
    actions?: ReactNode
}

// Not a route layout: error pages render it with their own text. A guard can
// show one in place of a whole layout, so it brings its own header and footer,
// unless it is drawn inside the console, which already has its sidebar.
export function ErrorLayout({ code, title, description, actions }: ErrorLayoutProps) {
    const embedded = useEmbedded()

    const body = (
        <>
            {code && <p className="font-mono text-sm text-muted-foreground">{code}</p>}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
            {actions}
        </>
    )

    if (embedded) {
        return <div className="flex flex-col items-center gap-6 px-6 py-24 text-center">{body}</div>
    }

    return (
        <div className="flex min-h-svh flex-col">
            <SiteHeader />
            <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
                {body}
            </main>
            <SiteFooter />
        </div>
    )
}
