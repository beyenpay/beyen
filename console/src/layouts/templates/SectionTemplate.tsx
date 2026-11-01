import { useState } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, Outlet } from "react-router"

import type { NavSection } from "@/config/nav"
import { useProjectId } from "@/hooks/useCurrentProject"
import { usePermission } from "@/hooks/usePermission"
import { ActionsSlotProvider } from "./actions"

// Title, optional tabs, and a slot for the buttons of the page below.
export function SectionTemplate({ section }: { section: NavSection }) {
    const { t } = useTranslation()
    const { can } = usePermission()
    const projectId = useProjectId()
    // State, not a ref: the page below needs the element once it exists.
    const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null)

    const tabs = (section.tabs ?? []).filter((tab) => !tab.permission || can(tab.permission, projectId))

    return (
        <ActionsSlotProvider value={actionsSlot}>
            <div className="flex h-full flex-col">
                <header className={`shrink-0 border-b px-6 pt-2 ${tabs.length === 0 ? "pb-2" : ""}`}>
                    <div className="flex min-h-9 items-center justify-between gap-4">
                        <h1 className="min-w-0 truncate text-xl font-medium">{t(section.label)}</h1>
                        <div ref={setActionsSlot} className="flex shrink-0 items-center gap-2" />
                    </div>
                    {tabs.length > 0 && (
                        <nav className="-mb-px mt-3 flex gap-6">
                            {tabs.map((tab) => (
                                <NavLink
                                    key={tab.path}
                                    to={tab.path}
                                    className={({ isActive }) =>
                                        `border-b-2 pb-2 text-sm ${isActive
                                            ? "border-foreground font-medium"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                        }`
                                    }
                                >
                                    {t(tab.label)}
                                </NavLink>
                            ))}
                        </nav>
                    )}
                </header>
                {/* console layout main x */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 pt-3">
                    <Outlet />
                </div>
            </div>
        </ActionsSlotProvider>
    )
}
