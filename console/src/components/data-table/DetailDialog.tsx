import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button, buttonVariants } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { DetailList } from "./cells"
import type { DetailAction, DetailContent } from "./types"

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-110", lg: "sm:max-w-2xl" }

const isExternal = (href: string) => /^https?:\/\//i.test(href)

// The dialog of one row, drawn from a DetailContent. The box never grows past
// the window: the heading and the buttons stay, and only the middle scrolls.
export function DetailDialog({
    content,
    open,
    onClose,
}: {
    // Stays set while the dialog fades out, so it does not go blank on the way.
    content: DetailContent | null
    open: boolean
    onClose: () => void
}) {
    const { t } = useTranslation()

    return (
        <Dialog open={open} onOpenChange={(next: boolean) => !next && onClose()}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0",
                    SIZES[content?.size ?? "md"],
                )}
            >
                {content && (
                    <>
                        <div className="shrink-0 px-6 pt-6 pb-4">
                            <DialogTitle className="text-lg leading-snug">{content.title}</DialogTitle>
                            {content.description && (
                                <DialogDescription className="mt-1.5">{content.description}</DialogDescription>
                            )}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
                            <div className="grid gap-6">
                                {content.metadata && content.metadata.length > 0 && (
                                    <section className="grid gap-3">
                                        <h3 className="text-base font-medium">
                                            {content.metadataTitle ?? t("dataTable.metadata")}
                                        </h3>
                                        <DetailList items={content.metadata} />
                                    </section>
                                )}
                                {content.sections?.map((s, i) => (
                                    <section key={i} className="grid gap-3">
                                        {s.title && <h3 className="text-base font-medium">{s.title}</h3>}
                                        {s.description && (
                                            <p className="text-sm text-muted-foreground">{s.description}</p>
                                        )}
                                        {s.items && s.items.length > 0 && <DetailList items={s.items} />}
                                        {s.content}
                                    </section>
                                ))}
                            </div>
                        </div>

                        {/* Alone, Close sits on the right; with other buttons it keeps the left and they go right. */}
                        <div
                            className={cn(
                                "flex shrink-0 items-center gap-3 px-6 pt-2 pb-6",
                                content.actions?.length ? "justify-between" : "justify-end",
                            )}
                        >
                            <DialogClose render={<Button variant="outline" />}>{t("dataTable.close")}</DialogClose>
                            {content.actions && content.actions.length > 0 && (
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    {content.actions.map((a) => (
                                        <ActionButton key={a.id} action={a} onClose={onClose} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

function ActionButton({ action: a, onClose }: { action: DetailAction; onClose: () => void }) {
    const className = buttonVariants({ variant: a.variant ?? "default" })
    const inner = (
        <>
            {a.icon && <a.icon />}
            {a.label}
        </>
    )
    const done = () => {
        a.onSelect?.()
        if (!a.keepOpen) {
            onClose()
        }
    }

    if (a.href && isExternal(a.href)) {
        return (
            <a href={a.href} target="_blank" rel="noreferrer" className={className} onClick={done}>
                {inner}
            </a>
        )
    }
    if (a.href) {
        return (
            <Link to={a.href} className={className} onClick={done}>
                {inner}
            </Link>
        )
    }
    return (
        <Button variant={a.variant ?? "default"} onClick={done}>
            {inner}
        </Button>
    )
}
