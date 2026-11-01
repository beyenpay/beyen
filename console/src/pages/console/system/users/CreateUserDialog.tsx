import { zodResolver } from "@hookform/resolvers/zod"
import type { ParseKeys } from "i18next"
import { Loader2Icon, RefreshCwIcon } from "lucide-react"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

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
import { toast } from "@/components/ui/toast"
import { getErrorMessage } from "@/lib/error-message"
import { generatePassword } from "@/lib/password"
import { useCreateUser } from "@/queries/console/system/users"
import { createUserSchema, type CreateUserValues } from "@/schemas/user"

export function CreateUserDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const { t } = useTranslation()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="gap-5 p-6 sm:max-w-md">
                <DialogTitle className="text-lg">{t("users.create.title")}</DialogTitle>
                {/* The form lives inside the content, so it is unmounted on close and starts clean next time. */}
                <CreateUserForm onDone={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    )
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
    const { t } = useTranslation()
    const create = useCreateUser()
    // After "generate" the password is shown, so it can be copied and handed over.
    const [reveal, setReveal] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<CreateUserValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: { email: "", password: "", role: "user" },
    })
    const role = useWatch({ control, name: "role" })

    // The schema's messages are i18n keys, translated here.
    const fieldMessage = (key?: string) => (key ? t(key as ParseKeys) : undefined)

    const submit = handleSubmit((values) =>
        create.mutate(values, {
            onSuccess: (user) => {
                toast.add({ type: "success", title: t("users.create.created", { email: user.email }) })
                onDone()
            },
        }),
    )

    function generate() {
        setValue("password", generatePassword(), { shouldValidate: true })
        setReveal(true)
    }

    return (
        // noValidate: zod validates, so the browser's own bubbles stay out of the way
        <form onSubmit={submit} noValidate>
            <FieldGroup>
                <Field>
                    <FieldLabel>{t("users.create.role")}</FieldLabel>
                    {/* The wrapper takes Field's full-width rule, so the pill keeps its own width. */}
                    <div>
                        <Segmented
                            ariaLabel={t("users.create.role")}
                            value={role}
                            onChange={(v) => setValue("role", v)}
                            options={[
                                { value: "user", label: t("users.roles.user") },
                                { value: "admin", label: t("users.roles.admin") },
                            ]}
                        />
                    </div>
                    <FieldDescription>
                        {role === "admin" ? t("users.create.adminHint") : t("users.create.userHint")}
                    </FieldDescription>
                </Field>

                <Field data-invalid={!!errors.email}>
                    <FieldLabel htmlFor="new-user-email">{t("users.email")}</FieldLabel>
                    <Input
                        id="new-user-email"
                        type="email"
                        autoComplete="off"
                        autoFocus
                        placeholder={t("users.create.emailPlaceholder")}
                        aria-invalid={!!errors.email}
                        {...register("email")}
                    />
                    {errors.email && <FieldError>{fieldMessage(errors.email.message)}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.password}>
                    <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="new-user-password">{t("users.create.password")}</FieldLabel>
                        <Button type="button" variant="ghost" size="xs" onClick={generate}>
                            <RefreshCwIcon /> {t("users.create.generate")}
                        </Button>
                    </div>
                    <Input
                        id="new-user-password"
                        type={reveal ? "text" : "password"}
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        {...register("password")}
                    />
                    {errors.password ? (
                        <FieldError>{fieldMessage(errors.password.message)}</FieldError>
                    ) : (
                        <FieldDescription>{t("users.create.passwordHint")}</FieldDescription>
                    )}
                </Field>

                {create.isError && (
                    <p role="alert" className="text-sm text-destructive">
                        {getErrorMessage(create.error)}
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="secondary" onClick={onDone}>
                        {t("users.create.cancel")}
                    </Button>
                    <Button type="submit" disabled={create.isPending}>
                        {create.isPending && <Loader2Icon className="animate-spin" />}
                        {t("users.create.submit")}
                    </Button>
                </div>
            </FieldGroup>
        </form>
    )
}
