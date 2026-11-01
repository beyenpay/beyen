import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import type { TableParams } from "@/hooks/useTableParams"

// Previous / next only, plus the range and the total. Pinned to the bottom of
// the scrolling area so it stays in reach on a long page.
export function DataTablePagination({ params, total }: { params: TableParams; total: number }) {
    const { t } = useTranslation()
    const { page, pageSize } = params
    const n = (v: number) => v.toLocaleString()

    return (
        <div className="sticky bottom-0 z-10 flex h-8 shrink-0 items-center gap-1 bg-beyen-console-table-header text-xs text-muted-foreground">
            <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("dataTable.prev")}
                disabled={page <= 1}
                onClick={() => params.setPage(page - 1)}
            >
                <ChevronLeftIcon />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("dataTable.next")}
                disabled={page * pageSize >= total}
                onClick={() => params.setPage(page + 1)}
            >
                <ChevronRightIcon />
            </Button>
            <span className="ml-2">
                {total === 0
                    ? t("dataTable.noResults")
                    : t("dataTable.range", {
                          from: n((page - 1) * pageSize + 1),
                          to: n(Math.min(page * pageSize, total)),
                          total: n(total),
                      })}
            </span>
        </div>
    )
}
