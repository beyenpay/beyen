import { lazy, Suspense } from "react"
import { createBrowserRouter, Outlet } from "react-router"
import { consoleRoutes } from "./navRoutes"
import { RouteGuard } from "./RouteGuard"
// ==== components ====
import { PageLoading } from "@/components/common/PageLoading"
// ==== layouts ====
import { AuthLayout } from "@/layouts/AuthLayout"
import { ConsoleLayout } from "@/layouts/ConsoleLayout"
import { LandingLayout } from "@/layouts/LandingLayout"
// ==== pages ====
import NotFoundPage from "@/pages/error/NotFoundPage"
import RouteErrorPage from "@/pages/error/RouteErrorPage"
import LandingPage from "@/pages/landing/LandingPage"
// ==== lazy pages ====
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"))

// A guard wraps the layout, never the other way round: when a guard blocks,
// its error page brings its own header and footer, so it must replace the
// layout instead of being drawn inside it.
export const router = createBrowserRouter([
    {
        // Safety net for every route below: a page file that failed to load, or a render error.
        errorElement: <RouteErrorPage />,
        // One boundary for all lazy pages: shows a spinner while their file downloads.
        element: (
            <Suspense fallback={<PageLoading />}>
                <Outlet />
            </Suspense>
        ),
        children: [
            // Public
            {
                element: <LandingLayout />,
                children: [
                    { path: "/", element: <LandingPage /> },
                ],
            },

            // Visitors only: a signed-in user is sent on to the console.
            {
                element: <RouteGuard guest />,
                children: [
                    {
                        element: <AuthLayout />,
                        children: [{ path: "/login", element: <LoginPage /> }],
                    },
                ],
            },

            // Signed-in users only.
            {
                element: <RouteGuard />,
                children: [
                    // Sidebar shell; every page below comes from config/nav.ts.
                    { path: "/console", element: <ConsoleLayout />, children: consoleRoutes },
                ],
            },

            { path: "*", element: <NotFoundPage /> },
        ],
    },
])