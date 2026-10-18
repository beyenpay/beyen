import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PERMISSIONS } from "@/constants/permissions"
import { useProjectId } from "@/hooks/useCurrentProject"
import { usePermission } from "@/hooks/usePermission"
import { PageActions } from "@/layouts/templates"

export default function CustomersPage() {
    const { can } = usePermission()
    const projectId = useProjectId()

    return (
        <>
            {can(PERMISSIONS.projectCustomerWrite, projectId) && (
                <PageActions>
                    <Button>
                        <Plus /> Add customer
                    </Button>
                </PageActions>
            )}
            <p className="text-sm text-muted-foreground">Customers table goes here.</p>
        </>
    )
}
