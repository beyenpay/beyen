import { useTranslation } from "react-i18next"
import { Outlet } from "react-router"

import type { NavSection } from "@/config/nav"

export function PageTemplate({ section }: { section: NavSection }) {
    const { t } = useTranslation()

    return (
        <div className="p-12">
            <h1 className="mb-8 text-2xl font-semibold text-red-500">{t(section.label)}</h1>
            <Outlet />
        </div>
    )
}
