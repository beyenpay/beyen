import { Outlet } from "react-router"
import { SiteHeader } from "./_components/site/SiteHeader"
import { SiteFooter } from "./_components/site/SiteFooter"

// Public pages: site header, the page, site footer.
export function LandingLayout() {
    return (
        <div className="flex min-h-svh flex-col">
            <SiteHeader />
            <main className="flex flex-1 flex-col">
                <Outlet />
            </main>
            <SiteFooter />
        </div>
    )
}