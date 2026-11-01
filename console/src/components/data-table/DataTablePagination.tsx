import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PAGE_SIZES, type TableParams } from "@/hooks/useTableParams"

// Previous / next only, plus the range and the total. Pinned to the bottom of
// the scrolling area so it stays in reach on a long page.
export function DataTablePagination({ params, total }: { params: TableParams; total: number }) {
    const { t } = useTranslation()
    const { page, pageSize } = params
    const n = (v: number) => v.toLocaleString()

    return (
        <div className="sticky bottom-0 left-0 z-10 flex h-9 w-(--dt-cw) shrink-0 items-center gap-1 bg-beyen-console-table-header px-1 text-xs text-muted-foreground">
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
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button variant="ghost" size="sm" className="ml-1 font-normal text-muted-foreground" />
                    }
                >
                    {total === 0
                        ? t("dataTable.noResults")
                        : t("dataTable.range", {
                              from: n((page - 1) * pageSize + 1),
                              to: n(Math.min(page * pageSize, total)),
                              total: n(total),
                          })}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-44">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>{t("dataTable.pageSize")}</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                            value={String(pageSize)}
                            onValueChange={(v) => params.setPageSize(Number(v))}
                        >
                            {PAGE_SIZES.map((s) => (
                                <DropdownMenuRadioItem key={s} value={String(s)} closeOnClick>
                                    {s}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
