import { useEffect } from "react"
import { Outlet, useParams } from "react-router"

import { useMe } from "@/queries/console/auth/me"
import { useProjectStore } from "@/stores/project"

// Wraps the /console/settings/:projectId/* routes: opening such a page makes
// that project the current one, so settings and the other pages stay in step.
export function ProjectParamSync() {
    const { projectId } = useParams()
    const { data: me } = useMe()
    const setCurrentProjectId = useProjectStore((s) => s.setCurrentProjectId)

    const id = Number(projectId)
    const isMember = !!me?.permissions.projects.some((p) => p.id === id)

    useEffect(() => {
        if (isMember) {
            setCurrentProjectId(id)
        }
    }, [id, isMember, setCurrentProjectId])

    return <Outlet />
}
