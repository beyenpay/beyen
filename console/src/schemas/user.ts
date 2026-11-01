import { z } from "zod"

import { newPassword } from "./auth"

// Messages are i18n keys, translated where they are shown. Mirrors the
// gateway's CreateUserRequest; `role` becomes its `system_role`.
export const createUserSchema = z.object({
    email: z.email("validation.emailInvalid").max(255, "validation.emailInvalid"),
    password: newPassword,
    role: z.enum(["user", "admin"]),
})

export type CreateUserValues = z.infer<typeof createUserSchema>
