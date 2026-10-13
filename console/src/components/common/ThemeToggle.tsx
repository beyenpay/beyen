import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/providers/ThemeProvider"

type Theme = "light" | "dark"

const CYCLE: Theme[] = ["light", "dark"]

const ICON: Record<Theme, React.ElementType> = {
    light: Sun,
    dark: Moon,
}

const LABEL: Record<Theme, string> = {
    light: "Light",
    dark: "Dark",
}

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const current = (CYCLE.includes(theme as Theme) ? theme : "light") as Theme
    const Icon = ICON[current]

    function toggle() {
        setTheme(CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length])
    }

    return (
        <Button variant="ghost" size="icon" onClick={toggle} title={LABEL[current]} className="w-8 h-8">
            <Icon
                key={current}
                className="w-4 h-4 animate-in fade-in zoom-in-50 duration-200"
            />
            <span className="sr-only">{LABEL[current]} theme</span>
        </Button>
    )
}