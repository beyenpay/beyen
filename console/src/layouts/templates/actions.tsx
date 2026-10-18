import { createContext, useContext, type ReactNode } from "react"
import { createPortal } from "react-dom"

// The element in a template's header where page buttons go. Set by the template.
const ActionsSlotContext = createContext<HTMLElement | null>(null)

export const ActionsSlotProvider = ActionsSlotContext.Provider

// A page renders its header buttons through this, e.g. a "Create" button.
// They show in the template header, top right, and go away with the page, so
// each tab brings its own. Outside a template it renders nothing.
export function PageActions({ children }: { children: ReactNode }) {
    const slot = useContext(ActionsSlotContext)
    return slot ? createPortal(children, slot) : null
}
