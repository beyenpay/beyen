import { z } from "zod"

// Messages are i18n keys: the page translates them where they are shown.
// The rules mirror the gateway's LoginRequest. The password has no minimum
// length on purpose, so accounts with older passwords can still sign in.
export const loginSchema = z.object({
    email: z.email("validation.emailInvalid").max(255, "validation.emailInvalid"),
    password: z
        .string()
        .min(1, "validation.passwordRequired")
        .max(128, "validation.passwordTooLong"),
})

export type LoginValues = z.infer<typeof loginSchema>

// Mirrors the gateway's password policy (pkg/password): 8 to 128 characters with
// at least one letter and one digit. The "not containing the email name" rule is
// left to the gateway, which answers WEAK_PASSWORD.
// The rule for a password being chosen, shared by every form that sets one.
export const newPassword = z
    .string()
    .min(1, "validation.passwordRequired")
    .min(8, "validation.passwordTooShort")
    .max(128, "validation.passwordTooLong")
    .refine((v) => /\p{L}/u.test(v) && /\p{Nd}/u.test(v), "validation.passwordWeak")

export const setupSchema = z
    .object({
        email: z.email("validation.emailInvalid").max(255, "validation.emailInvalid"),
        password: newPassword,
        confirmPassword: z.string().min(1, "validation.confirmPasswordRequired"),
    })
    .refine((v) => v.password === v.confirmPassword, {
        path: ["confirmPassword"],
        message: "validation.passwordMismatch",
    })

export type SetupValues = z.infer<typeof setupSchema>