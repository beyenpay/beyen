import { useTranslation } from "react-i18next"

import { ToneBadge } from "./ToneBadge"

// users.status in the gateway: 1 active, 2 disabled, 3 deleted.
const STATUS = {
    1: { label: "users.status.active", tone: "green" },
    2: { label: "users.status.disabled", tone: "gray" },
    3: { label: "users.status.deleted", tone: "red" },
} as const

export function UserStatusBadge({ status }: { status: number }) {
    const { t } = useTranslation()
    // An unknown status falls back to "disabled": the safe thing to show.
    const s = STATUS[status as keyof typeof STATUS] ?? STATUS[2]
    return <ToneBadge tone={s.tone}>{t(s.label)}</ToneBadge>
}

// `role` is the gateway's system_role: "admin", or empty for a normal user.
export function UserRoleBadge({ role }: { role: string }) {
    const { t } = useTranslation()
    return role === "admin" ? (
        <ToneBadge tone="purple">{t("users.roles.admin")}</ToneBadge>
    ) : (
        <ToneBadge>{t("users.roles.user")}</ToneBadge>
    )
}