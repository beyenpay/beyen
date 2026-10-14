import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { ErrorLayout } from "@/layouts/ErrorLayout"

export default function NotFoundPage() {
    const { t } = useTranslation()

    return (
        <ErrorLayout
            code="404"
            title={t("errorPage.notFound.title")}
            description={t("errorPage.notFound.description")}
            actions={
                <Button render={<Link to="/" />} nativeButton={false}>
                    {t("errorPage.backToHome")}
                </Button>
            }
        />
    )
}