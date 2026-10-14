import { useCallback } from "react"

import { isSystemPermission, type Permission } from "@/constants/permissions"
import { useMe } from "@/queries/console/auth/me"
import type { Me } from "@/types/me"

// Gateway model.ProjectStatusActive.
const PROJECT_ACTIVE = 1

export type Access = "granted" | "forbidden" | "not_found" | "project_disabled"

// Same decision order as the gateway's authz.CheckProject, so the UI tells the
// user what the API would. This only shapes the UI: the gateway enforces
// every permission again on each request.
export function checkAccess(me: Me, permission: Permission, projectId?: number): Access {
    // An admin's system list also holds every project.* permission, valid in any project.
    if (me.permissions.system.includes(permission)) {
        return "granted"
    }
    if (isSystemPermission(permission)) {
        return "forbidden"
    }

    const project = me.permissions.projects.find((p) => p.id === projectId)
    // Not a member looks the same as a missing project, as it does on the gateway.
    if (!project) {
        return "not_found"
    }
    if (project.status !== PROJECT_ACTIVE) {
        return "project_disabled"
    }
    return project.permissions.includes(permission) ? "granted" : "forbidden"
}

// For menus and buttons: can(PERMISSIONS.projectApiKeyWrite, projectId).
export function usePermission() {
    const { data: me } = useMe()

    const can = useCallback(
        (permission: Permission, projectId?: number) =>
            !!me && checkAccess(me, permission, projectId) === "granted",
        [me],
    )

    return { can }
}