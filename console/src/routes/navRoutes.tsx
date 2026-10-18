import { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from "react"
import type { ParseKeys } from "i18next"
import { Navigate, type RouteObject } from "react-router"

import { PROJECT_NAV, SUB_NAVS, type NavSection } from "@/config/nav"
import type { Permission } from "@/constants/permissions"
import { TEMPLATES } from "@/layouts/templates"
import PlaceholderPage from "@/pages/console/PlaceholderPage"
import { ProjectParamSync } from "./ProjectParamSync"
import { RouteGuard } from "./RouteGuard"

// Real pages by full route path. Anything not listed shows a placeholder.
const PAGES: Record<string, LazyExoticComponent<ComponentType>> = {
    "/console/home": lazy(() => import("@/pages/console/project/home/ProjectHomePage")),
    "/console/customers": lazy(() => import("@/pages/console/project/customers/CustomersPage")),
    "/console/developer/api-keys": lazy(() => import("@/pages/console/project/developer/ApiKeysPage")),
}

function page(path: string, label: ParseKeys): ReactNode {
    const Page = PAGES[path]
    return Page ? <Page /> : <PlaceholderPage label={label} />
}

function guarded(element: ReactNode, permission?: Permission): ReactNode {
    return permission ? <RouteGuard permission={permission}>{element}</RouteGuard> : element
}

function sectionRoute(prefix: string, s: NavSection): RouteObject {
    const full = `${prefix}/${s.path}`
    const tabs = s.tabs
    const Template = TEMPLATES[s.template ?? "section"]

    const body: RouteObject = {
        // The section's guard covers every tab; a tab may ask for more.
        element: guarded(<Template section={s} />, s.permission),
        children: tabs
            ? [
                { index: true, element: <Navigate to={tabs[0].path} replace /> },
                ...tabs.map((tab) => ({
                    path: tab.path,
                    element: guarded(page(`${full}/${tab.path}`, tab.label), tab.permission),
                })),
            ]
            : [{ index: true, element: page(full, s.label) }],
    }

    return {
        path: s.path,
        // Pages that name their project in the URL keep the current project in step with it.
        element: s.path.includes(":projectId") ? <ProjectParamSync /> : undefined,
        children: [body],
    }
}

// Children of the /console route.
export const consoleRoutes: RouteObject[] = [
    { index: true, element: <Navigate to="/console/home" replace /> },
    ...PROJECT_NAV.map((s) => sectionRoute("/console", s)),
    ...SUB_NAVS.map((sub) => ({
        path: sub.path,
        children: [
            { index: true, element: <Navigate to={sub.sections[0].path} replace /> },
            ...sub.sections.map((s) => sectionRoute(`/console/${sub.path}`, s)),
        ],
    })),
]
