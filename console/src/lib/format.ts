export function formatCompact(n: number) {
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    })
        .format(n)
        .toLowerCase()
}