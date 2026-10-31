import { zodResolver } from "@hookform/resolvers/zod"
import type { ParseKeys } from "i18next"
import { Loader2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/error-message"
import { useSetup } from "@/queries/console/auth/setup"
import { setupSchema, type SetupValues } from "@/schemas/auth"

export default function SetupPage() {
    const { t } = useTranslation()
    const setup = useSetup()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SetupValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: { email: "", password: "", confirmPassword: "" },
    })

    // The schema's messages are i18n keys, translated here.
    const fieldMessage = (key?: string) => (key ? t(key as ParseKeys) : undefined)

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("setup.title")}</CardTitle>
                <CardDescription>{t("setup.description")}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* noValidate: zod validates, so the browser's own bubbles stay out of the way */}
                <form onSubmit={handleSubmit((values) => setup.mutate(values))} noValidate>
                    <FieldGroup>
                        <Field data-invalid={!!errors.email}>
                            <FieldLabel htmlFor="email">{t("setup.email")}</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                autoFocus
                                placeholder={t("setup.emailPlaceholder")}
                                aria-invalid={!!errors.email}
                                {...register("email")}
                            />
                            {errors.email && (
                                <FieldError>{fieldMessage(errors.email.message)}</FieldError>
                            )}
                        </Field>

                        <Field data-invalid={!!errors.password}>
                            <FieldLabel htmlFor="password">{t("setup.password")}</FieldLabel>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={!!errors.password}
                                {...register("password")}
                            />
                            {errors.password ? (
                                <FieldError>{fieldMessage(errors.password.message)}</FieldError>
                            ) : (
                                <FieldDescription>{t("setup.passwordHint")}</FieldDescription>
                            )}
                        </Field>

                        <Field data-invalid={!!errors.confirmPassword}>
                            <FieldLabel htmlFor="confirmPassword">
                                {t("setup.confirmPassword")}
                            </FieldLabel>
                            <Input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={!!errors.confirmPassword}
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <FieldError>
                                    {fieldMessage(errors.confirmPassword.message)}
                                </FieldError>
                            )}
                        </Field>

                        <Field>
                            {setup.isError && (
                                <p role="alert" className="text-sm text-destructive">
                                    {getErrorMessage(setup.error)}
                                </p>
                            )}
                            <Button type="submit" disabled={setup.isPending}>
                                {setup.isPending && <Loader2Icon className="animate-spin" />}
                                {t("setup.submit")}
                            </Button>
                        </Field>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}
