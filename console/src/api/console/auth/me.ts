import { api } from "@/api/client"
import type { Me } from "@/types/me"

export function fetchMe(signal?: AbortSignal) {
    return api.get<Me>("/console/me", { signal })
}