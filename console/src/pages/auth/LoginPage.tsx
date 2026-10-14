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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/error-message"
import { useLogin } from "@/queries/console/auth/auth"
import { loginSchema, type LoginValues } from "@/schemas/auth"

export default function LoginPage() {
    const { t } = useTranslation()
    const login = useLogin()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    })

    // The schema's messages are i18n keys, translated here.
    const fieldMessage = (key?: string) => (key ? t(key as ParseKeys) : undefined)

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("login.title")}</CardTitle>
                <CardDescription>{t("login.description")}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* noValidate: zod validates, so the browser's own bubbles stay out of the way */}
                <form onSubmit={handleSubmit((values) => login.mutate(values))} noValidate>
                    <FieldGroup>
                        <Field data-invalid={!!errors.email}>
                            <FieldLabel htmlFor="email">{t("login.email")}</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                autoFocus
                                placeholder={t("login.emailPlaceholder")}
                                aria-invalid={!!errors.email}
                                {...register("email")}
                            />
                            {errors.email && (
                                <FieldError>{fieldMessage(errors.email.message)}</FieldError>
                            )}
                        </Field>

                        <Field data-invalid={!!errors.password}>
                            <FieldLabel htmlFor="password">{t("login.password")}</FieldLabel>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                aria-invalid={!!errors.password}
                                {...register("password")}
                            />
                            {errors.password && (
                                <FieldError>{fieldMessage(errors.password.message)}</FieldError>
                            )}
                        </Field>

                        <Field>
                            {login.isError && (
                                <p role="alert" className="text-sm text-destructive">
                                    {getErrorMessage(login.error)}
                                </p>
                            )}
                            <Button type="submit" disabled={login.isPending}>
                                {login.isPending && <Loader2Icon className="animate-spin" />}
                                {t("login.submit")}
                            </Button>
                        </Field>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}