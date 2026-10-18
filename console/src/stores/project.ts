import { create } from "zustand"
import { persist } from "zustand/middleware"

type ProjectState = {
    // Only the id: the project list and permissions live in the /me query.
    currentProjectId: number | null
    setCurrentProjectId: (id: number | null) => void
}

// localStorage is only the starting value of a new tab. Tabs do not follow
// each other, so switching project in one tab never changes another tab's data.
export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            currentProjectId: null,
            setCurrentProjectId: (id) => set({ currentProjectId: id }),
        }),
        { name: "beyen.console.project" },
    ),
)
