import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import { getErrorMessage } from "@/lib/error-message"
import { useDeleteUser } from "@/queries/console/system/users"
import type { UserRow } from "@/types/user"

export function DeleteUserDialog({
    user,
    open,
    onOpenChange,
}: {
    user: UserRow
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const { t } = useTranslation()
    const del = useDeleteUser()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto overscroll-contain p-6 sm:max-w-md"
            >
                <div className="grid gap-2">
                    <DialogTitle className="text-lg">{t("users.delete.title")}</DialogTitle>
                    <DialogDescription className="break-all text-foreground">
                        {t("users.delete.confirm", { email: user.email })}
                    </DialogDescription>
                </div>

                <ul className="grid list-disc gap-1.5 pl-5 text-sm text-muted-foreground">
                    <li>{t("users.delete.noteSignIn")}</li>
                    <li>{t("users.delete.noteRestore")}</li>
                </ul>

                {del.isError && (
                    <p role="alert" className="text-sm text-destructive">
                        {getErrorMessage(del.error)}
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        {t("users.delete.cancel")}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={del.isPending}
                        onClick={() =>
                            del.mutate(user.id, {
                                onSuccess: () => {
                                    toast.add({
                                        type: "success",
                                        title: t("users.delete.deleted", { email: user.email }),
                                    })
                                    onOpenChange(false)
                                },
                            })
                        }
                    >
                        {del.isPending && <Loader2Icon className="animate-spin" />}
                        {t("users.delete.submit")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
