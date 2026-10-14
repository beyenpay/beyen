import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { ErrorLayout } from "@/layouts/ErrorLayout"

export default function ForbiddenPage() {
    const { t } = useTranslation()

    return (
        <ErrorLayout
            code="403"
            title={t("errorPage.forbidden.title")}
            description={t("errorPage.forbidden.description")}
            actions={
                <Button render={<Link to="/console" />} nativeButton={false}>
                    {t("errorPage.backToConsole")}
                </Button>
            }
        />
    )
}
