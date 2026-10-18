import { createContext, useContext } from "react"

// True inside the console shell, whose sidebar is already on screen.
const EmbeddedContext = createContext(false)

export const EmbeddedProvider = EmbeddedContext.Provider
export const useEmbedded = () => useContext(EmbeddedContext)
