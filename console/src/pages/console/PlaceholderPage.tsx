import type { ParseKeys } from "i18next"
import { useTranslation } from "react-i18next"

// TEMP: stands in for every page that is not built yet. `heading` is true for
// a page of its own, false for a tab, whose title SectionLayout already shows.
export default function PlaceholderPage({ label, heading }: { label: ParseKeys; heading: boolean }) {
    const { t } = useTranslation()

    return heading ? (
        <div className="p-12">
            <h1 className="text-2xl font-semibold">{t(label)}</h1>
        </div>
    ) : (
        <p className="text-sm text-muted-foreground">{t(label)}</p>
    )
}
