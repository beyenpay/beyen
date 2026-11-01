import i18n from "@/i18n"

export function formatCompact(n: number) {
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    })
        .format(n)
        .toLowerCase()
}

// Unix seconds in the user's language, e.g. "Oct 31, 2026, 3:16 PM".
export function formatDateTime(unixSeconds: number) {
    return new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(unixSeconds * 1000)
}