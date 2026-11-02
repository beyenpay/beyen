import { z } from "zod"

// Messages are i18n keys, translated where they are shown. Mirrors the
// gateway's CreateProjectRequest: a name of 1 to 128 characters once trimmed,
// and an optional comment of up to 255.
export const createProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "validation.projectNameRequired")
        .max(128, "validation.projectNameTooLong"),
    comment: z.string().max(255, "validation.commentTooLong"),
})

export type CreateProjectValues = z.infer<typeof createProjectSchema>
