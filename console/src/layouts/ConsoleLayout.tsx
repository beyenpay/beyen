import { useEffect, useState } from "react"
import { ArrowLeft, PanelLeft, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, Outlet, useLocation } from "react-router"

import NavList from "./_components/console/NavList"
import ProjectSwitcher from "./_components/console/ProjectSwitcher"
import SearchDialog from "./_components/console/SearchDialog"
import UserMenu from "./_components/console/UserMenu"
import { EmbeddedProvider } from "./embedded"
import { Kbd } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ROOT_NAV, SUB_NAVS } from "@/config/nav"
import { useCurrentProject } from "@/hooks/useCurrentProject"

const COLLAPSED_KEY = "beyen.console.sidebar.collapsed"

const readCollapsed = () => {
    try {
        return localStorage.getItem(COLLAPSED_KEY) === "1"
    } catch {
        return false
    }
}

export function ConsoleLayout() {
    const { t } = useTranslation()
    const { pathname } = useLocation()
    const { project } = useCurrentProject()

    // The system console and account settings swap the sidebar in place, as
    // OpenAI's settings do, so the shell around it never remounts.
    const sub = SUB_NAVS.find(
        (s) => pathname === `/console/${s.path}` || pathname.startsWith(`/console/${s.path}/`),
    )

    const [collapsed, setCollapsed] = useState(readCollapsed)
    const [searchOpen, setSearchOpen] = useState(false)

    const [showLabels, setShowLabels] = useState(!collapsed)
    const toggleCollapsed = () => {
        if (!collapsed) setShowLabels(false)
        setCollapsed(!collapsed)
        try {
            localStorage.setItem(COLLAPSED_KEY, collapsed ? "0" : "1")
        } catch {
            // storage unavailable: just don't persist
        }
    }

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setSearchOpen((v) => !v)
            }
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [])

    return (
        <div className="flex h-dvh bg-beyen-console-surface overflow-hidden overscroll-none">
            <TooltipProvider delay={400}>
                <aside
                    onTransitionEnd={(e) => {
                        if (e.target === e.currentTarget && e.propertyName === "width" && !collapsed)
                            setShowLabels(true)
                    }}
                    className={`flex flex-col bg-beyen-console-sidebar text-beyen-console-foreground transition-[width] duration-200 ${collapsed ? "w-14" : "w-65"
                        }`}
                >
                    <div className="flex flex-col gap-2 p-2">
                        <div className="flex items-center">
                            {showLabels &&
                                (sub ? (
                                    <Link
                                        to="/console"
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-beyen-console-sidebar-active"
                                    >
                                        <ArrowLeft className="size-4" />
                                        {t("nav.backToProject")}
                                    </Link>
                                ) : (
                                    <ProjectSwitcher />
                                ))}

                            <button
                                onClick={toggleCollapsed}
                                aria-label="Toggle sidebar"
                                aria-expanded={!collapsed}
                                className={`ml-auto rounded-md p-2 transition-[margin] duration-200 hover:bg-beyen-console-sidebar-active ${collapsed ? "mr-0.75" : ""}`}
                            >
                                <PanelLeft className="size-4.5" />
                            </button>
                        </div>

                        <Tooltip disabled={showLabels}>
                            <TooltipTrigger
                                onClick={() => setSearchOpen(true)}
                                aria-label="Search"
                                className="flex h-8.5 w-full items-center gap-2.5 rounded-lg border bg-beyen-console-surface px-3 text-left shadow-xs transition-all duration-150 hover:-translate-y-px hover:border-foreground/20 hover:shadow-md active:translate-y-0 active:shadow-xs"
                            >
                                <Search className="size-4 shrink-0" />
                                {showLabels && (
                                    <>
                                        <span className="flex-1 text-sm text-muted-foreground">Search</span>
                                        <div className="flex gap-0.5">
                                            <Kbd>⌘</Kbd>
                                            <Kbd>K</Kbd>
                                        </div>
                                    </>
                                )}
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                Search <Kbd>⌘K</Kbd>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* The main sidebar keeps its icons when collapsed. A sub sidebar has
                        none, so collapsed it shows nothing but the toggle, search and user. */}
                    <nav className="flex flex-1 flex-col overflow-y-auto p-2">
                        {sub ? (
                            showLabels && <NavList prefix={`/console/${sub.path}`} sections={sub.sections} />
                        ) : (
                            <NavList
                                prefix="/console"
                                sections={ROOT_NAV}
                                projectId={project?.id}
                                showLabels={showLabels}
                            />
                        )}
                    </nav>

                    <div className="p-2">
                        <UserMenu collapsed={!showLabels} />
                    </div>
                </aside>
            </TooltipProvider>

            <main className="flex-1 overflow-y-auto overscroll-y-contain">
                <EmbeddedProvider value={true}>
                    <Outlet />
                </EmbeddedProvider>
            </main>

            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        </div>
    )
}
