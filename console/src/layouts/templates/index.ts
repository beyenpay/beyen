import type { ComponentType } from "react"

import type { NavSection } from "@/config/nav"
import { SectionTemplate } from "./SectionTemplate"

export { PageActions } from "./actions"

// Every template the console main area can use. Add a file, list it here, then
// pick it per entry with `template` in config/nav.ts.
export const TEMPLATES = {
    section: SectionTemplate, // title, optional tabs, header buttons
} satisfies Record<string, ComponentType<{ section: NavSection }>>

export type TemplateName = keyof typeof TEMPLATES
