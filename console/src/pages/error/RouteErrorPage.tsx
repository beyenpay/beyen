import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useRouteError } from "react-router"

import { Button } from "@/components/ui/button"
import { ErrorLayout } from "@/layouts/ErrorLayout"

// The router's safety net: a page chunk that failed to load, or a render error.
export default function RouteErrorPage() {
    const { t } = useTranslation()
    const error = useRouteError()

    // A custom boundary swallows the error, so log it here.
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <ErrorLayout
            title={t("errorPage.unexpected.title")}
            description={t("errorPage.unexpected.description")}
            actions={
                <div className="flex items-center gap-3">
                    <Button onClick={() => window.location.reload()}>
                        {t("errorPage.reload")}
                    </Button>
                    {/* A full reload, not <Link>: the router itself may be what failed */}
                    <Button variant="outline" render={<a href="/" />} nativeButton={false}>
                        {t("errorPage.backToHome")}
                    </Button>
                </div>
            }
        />
    )
}