import type { ParseKeys } from "i18next"

import { ApiError } from "@/api/errors"
import i18n from "@/i18n"

// Turns an error into text for the user. Translated by code; an unknown code
// or a non-ApiError falls back to the generic text, never to the raw English
// message. Shared by the global toast and by pages that show errors inline.
export function getErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        // The code comes from the server, so the key cannot be checked at compile
        // time. The second entry is the runtime fallback for unknown codes.
        const key = `errors.codes.${error.code}` as ParseKeys
        return i18n.t([key, "errors.fallback"])
    }
    return i18n.t("errors.fallback")
}