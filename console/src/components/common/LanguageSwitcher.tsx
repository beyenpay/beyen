import { Check, ChevronDown, Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LANGUAGES } from "@/i18n/languages"

export function LanguageSwitcher() {
    const { i18n } = useTranslation()

    // resolvedLanguage is the language actually in use after fallback,
    // so it always matches one of LANGUAGES (e.g. "en-US" resolves to "en").
    const current =
        LANGUAGES.find((lang) => lang.code === i18n.resolvedLanguage) ??
        LANGUAGES[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button variant="ghost" className="gap-2" />}
                className="text-muted-foreground text-xs"
            >
                <Globe className="size-4" />
                <span>{current.label}</span>
                <ChevronDown className="size-4 transition-transform group-aria-expanded/button:rotate-180" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-36">
                {LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => i18n.changeLanguage(lang.code)}
                        className="h-7"
                    >
                        <span className="text-xs">{lang.label}</span>
                        {lang.code === current.code && (
                            <Check className="ml-auto size-4" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}