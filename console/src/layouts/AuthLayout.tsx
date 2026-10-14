import { Outlet } from "react-router"
import { SiteHeader } from "./_components/site/SiteHeader"
import { SiteFooter } from "./_components/site/SiteFooter"

// Sign-in pages: the same chrome, with the page centered in a narrow column.
export function AuthLayout() {
    return (
        <div className="flex min-h-svh flex-col">
            <SiteHeader />
            <main className="flex flex-1 items-center justify-center px-6 py-10">
                <div className="w-full max-w-sm">
                    <Outlet />
                </div>
            </main>
            <SiteFooter />
        </div>
    )
}