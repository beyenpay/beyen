import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PERMISSIONS } from "@/constants/permissions"
import { useProjectId } from "@/hooks/useCurrentProject"
import { usePermission } from "@/hooks/usePermission"
import { PageActions } from "@/layouts/templates"

export default function ApiKeysPage() {
    const { can } = usePermission()
    const projectId = useProjectId()

    return (
        <>
            <PageActions>
                <Button variant="outline">API Key Usage</Button>
                {can(PERMISSIONS.projectApiKeyWrite, projectId) && (
                    <Button>
                        <Plus /> Create new secret key
                    </Button>
                )}
            </PageActions>
            <p className="text-sm text-muted-foreground">API keys table goes here.</p>
        </>
    )
}