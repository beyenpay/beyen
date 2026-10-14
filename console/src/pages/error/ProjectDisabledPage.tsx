import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { ErrorLayout } from "@/layouts/ErrorLayout"

export default function ProjectDisabledPage() {
    const { t } = useTranslation()

    return (
        <ErrorLayout
            title={t("errorPage.projectDisabled.title")}
            description={t("errorPage.projectDisabled.description")}
            actions={
                <Button render={<Link to="/console" />} nativeButton={false}>
                    {t("errorPage.backToConsole")}
                </Button>
            }
        />
    )
}