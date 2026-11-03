import { Loader2Icon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { getErrorMessage } from "@/lib/error-message"
import { useDeleteProject } from "@/queries/console/system/projects"
import type { ProjectRow } from "@/types/project"

export function DeleteProjectDialog({
    project,
    open,
    onOpenChange,
}: {
    project: ProjectRow
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const { t } = useTranslation()
    const del = useDeleteProject()
    // Typing the name is the confirmation. Compared as typed, apart from the
    // edges: a trailing space from a paste should not block the button.
    const [typed, setTyped] = useState("")
    const confirmed = typed.trim() === project.name

    function submit() {
        if (!confirmed || del.isPending) {
            return
        }
        del.mutate(project.id, {
            onSuccess: () => {
                toast.add({ type: "success", title: t("projects.delete.deleted", { name: project.name }) })
                onOpenChange(false)
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto overscroll-contain p-6 sm:max-w-md"
            >
                <div className="grid gap-3">
                    <DialogTitle className="text-lg wrap-break-word">
                        {t("projects.delete.title", { name: project.name })}
                    </DialogTitle>
                    <DialogDescription>{t("projects.delete.warning")}</DialogDescription>
                    <p className="text-sm font-medium wrap-break-word">
                        {t("projects.delete.confirmPrompt", { name: project.name })}
                    </p>
                </div>

                {/* A form, so Enter confirms once the name matches. */}
                <form
                    className="grid gap-5"
                    onSubmit={(e) => {
                        e.preventDefault()
                        submit()
                    }}
                    noValidate
                >
                    <Input
                        autoFocus
                        autoComplete="off"
                        value={typed}
                        placeholder={t("projects.delete.placeholder")}
                        aria-label={t("projects.delete.placeholder")}
                        onChange={(e) => setTyped(e.target.value)}
                    />

                    {del.isError && (
                        <p role="alert" className="text-sm text-destructive">
                            {getErrorMessage(del.error)}
                        </p>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            {t("projects.delete.cancel")}
                        </Button>
                        <Button type="submit" variant="destructive" disabled={!confirmed || del.isPending}>
                            {del.isPending && <Loader2Icon className="animate-spin" />}
                            {t("projects.delete.submit")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
