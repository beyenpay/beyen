import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { ErrorLayout } from "@/layouts/ErrorLayout"

// With onRetry the user can retry in place; without it, the way out is home.
export default function ServerErrorPage({ onRetry }: { onRetry?: () => void }) {
    const { t } = useTranslation()

    return (
        <ErrorLayout
            code="500"
            title={t("errorPage.serverError.title")}
            description={t("errorPage.serverError.description")}
            actions={
                onRetry ? (
                    <Button onClick={onRetry}>{t("errorPage.retry")}</Button>
                ) : (
                    <Button render={<Link to="/" />} nativeButton={false}>
                        {t("errorPage.backToHome")}
                    </Button>
                )
            }
        />
    )
}