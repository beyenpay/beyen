import { useTranslation } from "react-i18next"

import { ToneBadge } from "./ToneBadge"

// projects.status in the gateway: 1 active, 2 disabled (frozen), 3 deleted.
const STATUS = {
    1: { label: "projects.status.active", tone: "green" },
    2: { label: "projects.status.disabled", tone: "gray" },
    3: { label: "projects.status.deleted", tone: "red" },
} as const

export function ProjectStatusBadge({ status }: { status: number }) {
    const { t } = useTranslation()
    // An unknown status falls back to "frozen": the safe thing to show.
    const s = STATUS[status as keyof typeof STATUS] ?? STATUS[2]
    return <ToneBadge tone={s.tone}>{t(s.label)}</ToneBadge>
}
