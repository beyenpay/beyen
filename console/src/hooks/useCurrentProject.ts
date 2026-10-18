import { useMemo } from "react"
import { useParams } from "react-router"

import { useMe } from "@/queries/console/auth/me"
import { useProjectStore } from "@/stores/project"

// Gateway model.ProjectStatusActive.
const PROJECT_ACTIVE = 1

// Stored id if still a member, else the first active project, else the first
// project (all disabled: the guard shows the disabled page, the user can switch
// away), else null (a user with no project at all).
export function useCurrentProject() {
    const { data: me } = useMe()
    const storedId = useProjectStore((s) => s.currentProjectId)

    return useMemo(() => {
        const projects = me?.permissions.projects ?? []
        const project =
            projects.find((p) => p.id === storedId) ??
            projects.find((p) => p.status === PROJECT_ACTIVE) ??
            projects[0] ??
            null
        return { project, projects }
    }, [me, storedId])
}

// The project a page works on: :projectId in the URL on settings pages,
// otherwise the current project.
export function useProjectId() {
    const { projectId } = useParams()
    const { project } = useCurrentProject()
    return projectId === undefined ? project?.id : Number(projectId)
}
