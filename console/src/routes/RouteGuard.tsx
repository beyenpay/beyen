import type { ReactNode } from "react"
import { Navigate, Outlet, useLocation, useParams, type Location } from "react-router"
import { isSystemPermission, type Permission } from "@/constants/permissions"
import { useCurrentProject } from "@/hooks/useCurrentProject"
import { checkAccess } from "@/hooks/usePermission"
import ForbiddenPage from "@/pages/error/ForbiddenPage"
import NoProjectPage from "@/pages/error/NoProjectPage"
import NotFoundPage from "@/pages/error/NotFoundPage"
import ProjectDisabledPage from "@/pages/error/ProjectDisabledPage"
import ServerErrorPage from "@/pages/error/ServerErrorPage"
import { useMe } from "@/queries/console/auth/me"
import { PageLoading } from "@/components/common/PageLoading"

// The single route guard, driven entirely by the /me query:
//   <RouteGuard guest />                 visitors only; a signed-in user is sent on
//   <RouteGuard />                       any signed-in user
//   <RouteGuard permission="..." />      signed in, and holding the permission
// Use it as a layout route (renders <Outlet />) or around a single element.
type RouteGuardProps = (
    | { guest: true; permission?: never }
    | { guest?: false; permission?: Permission }
) & { children?: ReactNode }

// A signed-in visitor of a guest-only page goes back to where they were sent
// away from (set below), otherwise to the console.
function returnTarget(state: unknown) {
    const from = (state as { from?: Location } | null)?.from
    return from ?? "/console"
}

export function RouteGuard({ guest, permission, children }: RouteGuardProps) {
    const { data: me, isError, refetch } = useMe()
    const location = useLocation()
    const params = useParams()
    const { project: currentProject } = useCurrentProject()

    // data survives a failed background refetch, so only a first load that has
    // nothing to show gets here. A toast is no use: the page itself is blank.
    if (me === undefined) {
        return isError ? <ServerErrorPage onRetry={() => void refetch()} /> : <PageLoading />
    }

    const content = children ?? <Outlet />

    if (guest) {
        return me ? <Navigate to={returnTarget(location.state)} replace /> : content
    }

    if (me === null) {
        return <Navigate to="/login" replace state={{ from: location }} />
    }

    if (!permission) {
        return content
    }

    // Settings pages carry the project in the URL (like the gateway's :project_id);
    // every other project page uses the current project from the store.
    const paramId = params.projectId === undefined ? undefined : Number(params.projectId)
    const projectId = paramId ?? currentProject?.id

    // A project page with no project to show: a user without any project,
    // including an admin who is not a member of any.
    if (!isSystemPermission(permission) && projectId === undefined) {
        return <NoProjectPage />
    }

    switch (checkAccess(me, permission, projectId)) {
        case "granted":
            return content
        case "forbidden":
            return <ForbiddenPage />
        case "not_found":
            return <NotFoundPage />
        case "project_disabled":
            return <ProjectDisabledPage />
    }
}