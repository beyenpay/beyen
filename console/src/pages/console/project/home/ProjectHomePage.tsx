import { useEffect, useState } from "react"
import {
    PanelLeft,
    Search,
    Home,
    Key,
    Settings,
} from "lucide-react"
import ProjectSwitcher from "./_components/ProjectSwitcher"
import SearchDialog from "./_components/SearchDialog"
import UserMenu from "./_components/UserMenu"
import { MultiLinePlaceholder } from "@/components/dev/MultiLinePlaceholder"
import { Kbd } from "@/components/ui/kbd"

const NAV = [
    { label: "Home", icon: Home },
    { label: "API Keys", icon: Key },
    { label: "Settings", icon: Settings },
]

export default function ProjectHomePage() {
    const [collapsed, setCollapsed] = useState(false)
    const [active, setActive] = useState("Settings")
    const [searchOpen, setSearchOpen] = useState(false)
    const [project, setProject] = useState("Default project")
    // Labels (project name, search text, nav text) are hidden at once when collapsing,
    // but shown only after the width transition ends when expanding.
    const [showLabels, setShowLabels] = useState(true)
    const toggleCollapsed = () => {
        if (!collapsed) setShowLabels(false)
        setCollapsed((v) => !v)
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
                        {showLabels && <ProjectSwitcher current={project} onChange={setProject} />}

                        <button
                            onClick={toggleCollapsed}
                            aria-label="Toggle sidebar"
                            aria-expanded={!collapsed}
                            className={`ml-auto rounded-md p-2 transition-[margin] duration-200 hover:bg-beyen-console-sidebar-active ${collapsed ? "mr-0.75" : ""}`}
                        >
                            <PanelLeft className="size-4.5" />
                        </button>
                    </div>

                    <button
                        onClick={() => setSearchOpen(true)}
                        aria-label="Search"
                        title={showLabels ? undefined : "Search"}
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
                    </button>
                </div>

                <nav className="flex flex-1 flex-col overflow-y-auto p-2">
                    {NAV.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            onClick={() => setActive(label)}
                            aria-label={label}
                            title={showLabels ? undefined : label}
                            className={`flex h-9 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${active === label
                                ? "bg-beyen-console-sidebar-active font-medium"
                                : "hover:bg-beyen-console-sidebar-hover"
                                }`}
                        >
                            <Icon className="size-4.5 shrink-0" />
                            {showLabels && <span>{label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-2">
                    <UserMenu collapsed={!showLabels} />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-12 text-2xl overscroll-y-contain">
                <MultiLinePlaceholder />
            </main>

            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        </div>
    )
}