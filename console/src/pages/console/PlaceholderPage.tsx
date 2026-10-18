import type { ParseKeys } from "i18next"
import { useTranslation } from "react-i18next"

// TEMP: stands in for every page that is not built yet. The title comes from
// the template around it, so this only shows a line of text.
export default function PlaceholderPage({ label }: { label: ParseKeys }) {
    const { t } = useTranslation()

    return <p className="text-sm text-muted-foreground">{t(label)}</p>
}
