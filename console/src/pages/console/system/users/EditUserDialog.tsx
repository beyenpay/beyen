import { zodResolver } from "@hookform/resolvers/zod"
import type { ParseKeys } from "i18next"
import { Loader2Icon, RefreshCwIcon } from "lucide-react"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import type { UserPatch } from "@/api/console/system/users"
import { Segmented } from "@/components/common/Segmented"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { getErrorMessage } from "@/lib/error-message"
import { generatePassword } from "@/lib/password"
import { useSaveUser } from "@/queries/console/system/users"
import { editUserSchema, type EditUserValues } from "@/schemas/user"
import { USER_STATUS, type UserRow } from "@/types/user"

export function EditUserDialog({
    user,
    isSelf,
    open,
    onOpenChange,
}: {
    user: UserRow
    // Your own account: the role and status are locked, and there is no password reset.
    isSelf: boolean
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const { t } = useTranslation()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto overscroll-contain p-6 sm:max-w-md"
            >
                <DialogTitle className="text-lg">{t("users.edit.title")}</DialogTitle>
                {/* The form lives inside the content, so it is unmounted on close and starts clean next time. */}
                <EditUserForm user={user} isSelf={isSelf} onDone={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    )
}

function EditUserForm({
    user,
    isSelf,
    onDone,
}: {
    user: UserRow
    isSelf: boolean
    onDone: () => void
}) {
    const { t } = useTranslation()
    const save = useSaveUser()
    // The password block is hidden until asked for; empty means "keep the password".
    const [resetting, setResetting] = useState(false)
    const [reveal, setReveal] = useState(false)

    const currentRole = user.system_role === "admin" ? "admin" : "user"
    const currentStatus = user.status === USER_STATUS.disabled ? "disabled" : "active"

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<EditUserValues>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            email: user.email,
            role: currentRole,
            status: currentStatus,
            comment: user.comment,
            password: "",
        },
    })
    const role = useWatch({ control, name: "role" })
    const status = useWatch({ control, name: "status" })

    const fieldMessage = (key?: string) => (key ? t(key as ParseKeys) : undefined)

    const submit = handleSubmit((values) => {
        // Only what changed goes out, so an untouched role or status never
        // ends the user's sessions, and nothing is sent for an unchanged form.
        const patch: UserPatch = {}
        const email = values.email.trim()
        if (email.toLowerCase() !== user.email) {
            patch.email = email
        }
        if (!isSelf && values.role !== currentRole) {
            patch.role = values.role
        }
        if (!isSelf && values.status !== currentStatus) {
            patch.status = values.status
        }
        const comment = values.comment.trim()
        if (comment !== user.comment) {
            patch.comment = comment
        }
        const password = !isSelf && resetting && values.password ? values.password : undefined

        if (Object.keys(patch).length === 0 && !password) {
            onDone()
            return
        }
        save.mutate(
            { id: user.id, patch, password },
            {
                onSuccess: () => {
                    toast.add({ type: "success", title: t("users.edit.saved", { email: patch.email ?? user.email }) })
                    onDone()
                },
            },
        )
    })

    function generate() {
        setValue("password", generatePassword(), { shouldValidate: true })
        setReveal(true)
    }

    function cancelReset() {
        setValue("password", "", { shouldValidate: true })
        setResetting(false)
        setReveal(false)
    }

    return (
        // noValidate: zod validates, so the browser's own bubbles stay out of the way
        <form onSubmit={submit} noValidate>
            <FieldGroup>
                <Field data-invalid={!!errors.email}>
                    <FieldLabel htmlFor="edit-user-email">{t("users.email")}</FieldLabel>
                    <Input
                        id="edit-user-email"
                        type="email"
                        autoComplete="off"
                        aria-invalid={!!errors.email}
                        {...register("email")}
                    />
                    {errors.email && <FieldError>{fieldMessage(errors.email.message)}</FieldError>}
                </Field>

                <Field>
                    <FieldLabel>{t("users.create.role")}</FieldLabel>
                    {/* The wrapper takes Field's full-width rule, so the pill keeps its own width. */}
                    <div>
                        <Segmented
                            ariaLabel={t("users.create.role")}
                            value={role}
                            onChange={(v) => setValue("role", v)}
                            disabled={isSelf}
                            options={[
                                { value: "user", label: t("users.roles.user") },
                                { value: "admin", label: t("users.roles.admin") },
                            ]}
                        />
                    </div>
                    <FieldDescription>
                        {isSelf
                            ? t("users.edit.selfHint")
                            : role === "admin"
                              ? t("users.create.adminHint")
                              : t("users.create.userHint")}
                    </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel>{t("users.edit.status")}</FieldLabel>
                    <div>
                        <Segmented
                            ariaLabel={t("users.edit.status")}
                            value={status}
                            onChange={(v) => setValue("status", v)}
                            disabled={isSelf}
                            options={[
                                { value: "active", label: t("users.status.active") },
                                { value: "disabled", label: t("users.status.disabled") },
                            ]}
                        />
                    </div>
                    <FieldDescription>{t("users.statusHint")}</FieldDescription>
                </Field>

                <Field data-invalid={!!errors.comment}>
                    <FieldLabel htmlFor="edit-user-comment">
                        {t("users.comment")}
                        <span className="font-normal text-muted-foreground">{t("users.optional")}</span>
                    </FieldLabel>
                    <Textarea
                        id="edit-user-comment"
                        rows={2}
                        className="max-h-32 min-h-16 resize-none"
                        placeholder={t("users.commentPlaceholder")}
                        aria-invalid={!!errors.comment}
                        {...register("comment")}
                    />
                    {errors.comment && <FieldError>{fieldMessage(errors.comment.message)}</FieldError>}
                </Field>

                {!isSelf && (
                    <Field data-invalid={!!errors.password} className="border-t pt-5">
                        {resetting ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <FieldLabel htmlFor="edit-user-password">{t("users.edit.newPassword")}</FieldLabel>
                                    <div className="flex items-center">
                                        <Button type="button" variant="ghost" size="xs" onClick={generate}>
                                            <RefreshCwIcon /> {t("users.create.generate")}
                                        </Button>
                                        <Button type="button" variant="ghost" size="xs" onClick={cancelReset}>
                                            {t("users.edit.cancelReset")}
                                        </Button>
                                    </div>
                                </div>
                                <Input
                                    id="edit-user-password"
                                    type={reveal ? "text" : "password"}
                                    autoComplete="new-password"
                                    autoFocus
                                    aria-invalid={!!errors.password}
                                    {...register("password")}
                                />
                                {errors.password ? (
                                    <FieldError>{fieldMessage(errors.password.message)}</FieldError>
                                ) : (
                                    <FieldDescription>
                                        {t("users.create.passwordHint")} {t("users.edit.resetHint")}
                                    </FieldDescription>
                                )}
                            </>
                        ) : (
                            <div>
                                <Button type="button" variant="outline" size="sm" onClick={() => setResetting(true)}>
                                    {t("users.edit.resetPassword")}
                                </Button>
                            </div>
                        )}
                    </Field>
                )}

                {save.isError && (
                    <p role="alert" className="text-sm text-destructive">
                        {getErrorMessage(save.error)}
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="secondary" onClick={onDone}>
                        {t("users.edit.cancel")}
                    </Button>
                    <Button type="submit" disabled={save.isPending}>
                        {save.isPending && <Loader2Icon className="animate-spin" />}
                        {t("users.edit.save")}
                    </Button>
                </div>
            </FieldGroup>
        </form>
    )
}
