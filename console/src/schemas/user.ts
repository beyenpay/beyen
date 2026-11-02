import { z } from "zod"

import { newPassword } from "./auth"

// Messages are i18n keys, translated where they are shown. Mirrors the
// gateway's CreateUserRequest; `role` becomes its `system_role`.
const email = z.email("validation.emailInvalid").max(255, "validation.emailInvalid")
// Counted in characters, as the gateway does.
const comment = z.string().max(255, "validation.commentTooLong")

export const createUserSchema = z.object({
    email,
    password: newPassword,
    role: z.enum(["user", "admin"]),
    comment,
})

export type CreateUserValues = z.infer<typeof createUserSchema>

// The edit form. The password is only filled in to reset it; empty means keep.
// Not a union with newPassword: a union reports a generic "Invalid input"
// instead of the rule that failed.
const optionalPassword = z.string().superRefine((value, ctx) => {
    if (value === "") {
        return
    }
    const result = newPassword.safeParse(value)
    if (!result.success) {
        ctx.addIssue({ code: "custom", message: result.error.issues[0].message })
    }
})

export const editUserSchema = z.object({
    email,
    role: z.enum(["user", "admin"]),
    status: z.enum(["active", "disabled"]),
    comment,
    password: optionalPassword,
})

export type EditUserValues = z.infer<typeof editUserSchema>
