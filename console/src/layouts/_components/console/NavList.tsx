import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { NavSection } from "@/config/nav"
import { isSystemPermission } from "@/constants/permissions"
import { usePermission } from "@/hooks/usePermission"

export default function NavList({
    prefix,
    sections,
    projectId,
    showLabels = true,
}: {
    prefix: string
    sections: NavSection[]
    projectId?: number
    // False while the sidebar is collapsed: icon only, with a tooltip.
    showLabels?: boolean
}) {
    const { t } = useTranslation()
    const { pathname } = useLocation()
    const { can } = usePermission()

    const visible = sections.filter((s) => {
        if (!s.permission) {
            return true
        }
        // A project page needs a project. Without this check an admin, whose
        // system rights pass can() for any id, would see project pages with no project.
        if (!isSystemPermission(s.permission) && projectId === undefined) {
            return false
        }
        return can(s.permission, projectId)
    })

    return (
        <ul className="flex flex-col">
            {visible.map((s) => {
                const base = `${prefix}/${s.path.replace(":projectId", String(projectId))}`
                const to = s.tabs ? `${base}/${s.tabs[0].path}` : base
                const active = pathname === base || pathname.startsWith(`${base}/`)
                const label = t(s.label)
                const Icon = s.icon

                return (
                    <li key={s.path}>
                        <Tooltip disabled={showLabels}>
                            <TooltipTrigger
                                render={<Link to={to} />}
                                aria-label={label}
                                className={`flex h-9 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                                    active
                                        ? "bg-beyen-console-sidebar-active font-medium"
                                        : "hover:bg-beyen-console-sidebar-hover"
                                }`}
                            >
                                {Icon && <Icon className="size-4.5 shrink-0" />}
                                {showLabels && (
                                    <>
                                        <span className="flex-1">{label}</span>
                                        {s.tag && (
                                            <span className="rounded-sm bg-beyen-console-sidebar-tag text-beyen-console-sidebar-tag-foreground px-2 py-0.5 text-xs font-medium ">
                                                {t(s.tag)}
                                            </span>
                                        )}
                                    </>
                                )}
                            </TooltipTrigger>
                            <TooltipContent side="right">{label}</TooltipContent>
                        </Tooltip>
                    </li>
                )
            })}
        </ul>
    )
}
