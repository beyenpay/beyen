import { useEffect, useRef, useState } from "react"
import {
    Check,
    ChevronsUpDown,
    Plus,
    Settings,
} from "lucide-react"

const PROJECTS = ["Default project", "bullbull"]

export default function ProjectSwitcher({
    current,
    onChange,
}: {
    current: string
    onChange: (name: string) => void
}) {
    const [open, setOpen] = useState(false)
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
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-beyen-console-menu-hover"

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-beyen-console-sidebar-active ${open ? "bg-beyen-console-sidebar-active" : ""
                    }`}
            >
                {current}
                <ChevronsUpDown className="size-4" />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-2 w-60 rounded-2xl border bg-beyen-console-menu p-2 text-beyen-console-foreground shadow-lg">
                    <div className="px-3 py-2 uppercase tracking-wider text-muted-foreground text-xs">
                        Projects
                    </div>
                    {PROJECTS.map((name) => (
                        <button
                            key={name}
                            onClick={() => {
                                onChange(name)
                                setOpen(false)
                            }}
                            className={`${itemCls} ${current === name ? "font-medium" : ""
                                }`}
                        >
                            <Check
                                className={`size-3.5 shrink-0 ${current === name ? "" : "invisible"
                                    }`}
                            />
                            {name}
                        </button>
                    ))}

                    <div className="my-2 border-t" />

                    <button className={itemCls} onClick={() => setOpen(false)}>
                        <Plus className="size-4 shrink-0" />
                        Create project
                    </button>
                    <button className={itemCls} onClick={() => setOpen(false)}>
                        <Settings className="size-4 shrink-0" />
                        Manage projects
                    </button>
                </div>
            )}
        </div>
    )
}