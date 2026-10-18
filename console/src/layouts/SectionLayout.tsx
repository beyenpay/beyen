import { useTranslation } from "react-i18next"
import { NavLink, Outlet } from "react-router"

import type { NavSection } from "@/config/nav"
import { useProjectId } from "@/hooks/useCurrentProject"
import { usePermission } from "@/hooks/usePermission"

export function SectionLayout({ section }: { section: NavSection }) {
    const { t } = useTranslation()
    const { can } = usePermission()
    const projectId = useProjectId()

    const tabs = (section.tabs ?? []).filter((tab) => !tab.permission || can(tab.permission, projectId))

    return (
        <>
            <header className="border-b px-12 pt-8">
                <h1 className="text-2xl font-semibold">{t(section.label)}</h1>
                <nav className="-mb-px mt-4 flex gap-6">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                `border-b-2 pb-3 text-sm ${
                                    isActive
                                        ? "border-foreground font-medium"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                }`
                            }
                        >
                            {t(tab.label)}
                        </NavLink>
                    ))}
                </nav>
            </header>
            <div className="p-12">
                <Outlet />
            </div>
        </>
    )
}
