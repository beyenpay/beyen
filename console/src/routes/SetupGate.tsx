import { Navigate, Outlet } from "react-router"

import { PageLoading } from "@/components/common/PageLoading"
import ServerErrorPage from "@/pages/error/ServerErrorPage"
import { useSetupStatus } from "@/queries/console/auth/setup"

// Chooses between the first-run setup page and the login page:
//   <SetupGate />            for /login: a system without users is sent to /setup
//   <SetupGate required />   for /setup: once a user exists it is sent to /login
export function SetupGate({ required = false }: { required?: boolean }) {
    const { data, isError, refetch } = useSetupStatus()

    if (data === undefined) {
        return isError ? <ServerErrorPage onRetry={() => void refetch()} /> : <PageLoading />
    }

    if (data.needs_setup === required) {
        return <Outlet />
    }
    return <Navigate to={required ? "/login" : "/setup"} replace />
}
