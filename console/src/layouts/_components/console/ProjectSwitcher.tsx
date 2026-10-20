import { useEffect, useRef, useState } from "react"
import {
    Check,
    ChevronsUpDown,
    Plus,
    Settings,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router"
import { PERMISSIONS } from "@/constants/permissions"
import { useCurrentProject } from "@/hooks/useCurrentProject"
import { usePermission } from "@/hooks/usePermission"
import { useProjectStore } from "@/stores/project"

export default function ProjectSwitcher() {
    const { t } = useTranslation()
    const { project: current, projects } = useCurrentProject()
    const { can } = usePermission()
    const setCurrentProjectId = useProjectStore((s) => s.setCurrentProjectId)
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [open, setOpen] = useState(false)

    function switchProject(id: number) {
        setCurrentProjectId(id)

        // A settings page keeps its sub-path under the new project id.
        const settings = pathname.match(/^\/console\/settings\/\d+(\/.*)?$/)
        if (settings) {
            navigate(`/console/settings/${id}${settings[1] ?? ""}`)
            return
        }
        // A detail page (e.g. /console/transactions/123) does not exist in the
        // other project, so fall back to its section.
        const segments = pathname.split("/") // ["", "console", "transactions", "123"]
        if (segments.length > 3) {
            navigate(`/console/${segments[2]}`)
        }
    }
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onMouseDown = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("mousedown", onMouseDown)
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("mousedown", onMouseDown)
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [open])

    const itemCls =
        "flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-beyen-console-menu-hover"

    const canCreate = can(PERMISSIONS.systemProjectWrite)
    const canManage = can(PERMISSIONS.systemProjectRead)

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-beyen-console-sidebar-active ${open ? "bg-beyen-console-sidebar-active" : ""
                    }`}
            >
                {current?.name ?? t("project.none")}
                <ChevronsUpDown className="size-4" />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-2 w-60 rounded-2xl border bg-beyen-console-menu p-2 text-beyen-console-foreground shadow-lg">
                    <div className="px-3 py-1.5 uppercase tracking-wider text-muted-foreground text-[10px]">
                        Projects
                    </div>
                    {projects.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => {
                                switchProject(p.id)
                                setOpen(false)
                            }}
                            className={`${itemCls} ${current?.id === p.id ? "font-medium" : ""}`}
                        >
                            <Check
                                className={`size-3.5 shrink-0 ${current?.id === p.id ? "" : "invisible"}`}
                            />
                            {p.name}
                            {/* 1 is the gateway's ProjectStatusActive */}
                            {p.status !== 1 && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {t("project.disabled")}
                                </span>
                            )}
                        </button>
                    ))}

                    {(canCreate || canManage) && (
                        <>
                            <div className="my-1 border-t" />

                            {canCreate && (
                                <button className={itemCls} onClick={() => setOpen(false)}>
                                    <Plus className="size-4 shrink-0" />
                                    Create project
                                </button>
                            )}
                            {canManage && (
                                <button
                                    className={itemCls}
                                    onClick={() => {
                                        navigate("/console/system/projects")
                                        setOpen(false)
                                    }}
                                >
                                    <Settings className="size-4 shrink-0" />
                                    Manage projects
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}