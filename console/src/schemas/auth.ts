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