import type { ReactNode } from "react"
import { SiteHeader } from "./_components/site/SiteHeader"
import { SiteFooter } from "./_components/site/SiteFooter"


type ErrorLayoutProps = {
    code?: string
    title: string
    description: string
    actions?: ReactNode
}

// Not a route layout: error pages render it with their own text. A guard can
// show one in place of a whole layout, so it brings its own header and footer.
export function ErrorLayout({ code, title, description, actions }: ErrorLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col">
            <SiteHeader />
            <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
                {code && <p className="font-mono text-sm text-muted-foreground">{code}</p>}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                {actions}
            </main>
            <SiteFooter />
        </div>
    )
}