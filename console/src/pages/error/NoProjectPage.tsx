import { useTranslation } from "react-i18next"

// Content only, no ErrorLayout: it is drawn inside the console, so the user
// keeps the sidebar.
export default function NoProjectPage() {
    const { t } = useTranslation()

    return (
        <div className="flex flex-col items-center gap-2 py-24 text-center">
            <h1 className="text-xl font-medium">{t("errorPage.noProject.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("errorPage.noProject.description")}</p>
        </div>
    )
}
