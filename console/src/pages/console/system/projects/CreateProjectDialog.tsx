import { zodResolver } from "@hookform/resolvers/zod"
import type { ParseKeys } from "i18next"
import { Loader2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { getErrorMessage } from "@/lib/error-message"
import { useCreateProject } from "@/queries/console/system/projects"
import { createProjectSchema, type CreateProjectValues } from "@/schemas/project"
import type { ProjectRow } from "@/types/project"

export function CreateProjectDialog({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    // Called after the project is saved and the dialog has been told to close.
    onCreated?: (project: ProjectRow) => void
}) {
    const { t } = useTranslation()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto overscroll-contain p-6 sm:max-w-md"
            >
                <div className="grid gap-2">
                    <DialogTitle className="text-lg">{t("projects.create.title")}</DialogTitle>
                    <DialogDescription>{t("projects.create.description")}</DialogDescription>
                </div>
                {/* The form lives inside the content, so it is unmounted on close and starts clean next time. */}
                <CreateProjectForm onDone={() => onOpenChange(false)} onCreated={onCreated} />
            </DialogContent>
        </Dialog>
    )
}

function CreateProjectForm({
    onDone,
    onCreated,
}: {
    onDone: () => void
    onCreated?: (project: ProjectRow) => void
}) {
    const { t } = useTranslation()
    const create = useCreateProject()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateProjectValues>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: { name: "", comment: "" },
    })

    // The schema's messages are i18n keys, translated here.
    const fieldMessage = (key?: string) => (key ? t(key as ParseKeys) : undefined)

    const submit = handleSubmit((values) =>
        create.mutate(values, {
            onSuccess: (project) => {
                toast.add({ type: "success", title: t("projects.create.created", { name: project.name }) })
                onDone()
                onCreated?.(project)
            },
        }),
    )

    return (
        // noValidate: zod validates, so the browser's own bubbles stay out of the way
        <form onSubmit={submit} noValidate>
            <FieldGroup>
                <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="new-project-name">{t("projects.create.name")}</FieldLabel>
                    <Input
                        id="new-project-name"
                        autoComplete="off"
                        autoFocus
                        aria-invalid={!!errors.name}
                        {...register("name")}
                    />
                    {errors.name ? (
                        <FieldError>{fieldMessage(errors.name.message)}</FieldError>
                    ) : (
                        <FieldDescription>{t("projects.create.nameHint")}</FieldDescription>
                    )}
                </Field>

                <Field data-invalid={!!errors.comment}>
                    <FieldLabel htmlFor="new-project-comment">
                        {t("projects.comment")}
                        <span className="font-normal text-muted-foreground">{t("projects.optional")}</span>
                    </FieldLabel>
                    <Textarea
                        id="new-project-comment"
                        rows={2}
                        className="max-h-32 min-h-16 resize-none"
                        placeholder={t("projects.commentPlaceholder")}
                        aria-invalid={!!errors.comment}
                        {...register("comment")}
                    />
                    {errors.comment && <FieldError>{fieldMessage(errors.comment.message)}</FieldError>}
                </Field>

                {create.isError && (
                    <p role="alert" className="text-sm text-destructive">
                        {getErrorMessage(create.error)}
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="secondary" onClick={onDone}>
                        {t("projects.create.cancel")}
                    </Button>
                    <Button type="submit" disabled={create.isPending}>
                        {create.isPending && <Loader2Icon className="animate-spin" />}
                        {t("projects.create.submit")}
                    </Button>
                </div>
            </FieldGroup>
        </form>
    )
}
