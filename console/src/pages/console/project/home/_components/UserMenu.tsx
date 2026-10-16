
import {
    Code,
    Languages,
    LogOut,
    Palette,
    Users,
    CircleUserRound,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/providers/ThemeProvider"
import { LANGUAGES } from "@/i18n/languages"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEME_OPTIONS = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
]

const itemCls = "gap-3 rounded-lg px-3 py-2 text-sm focus:bg-beyen-console-menu-hover"
const subTriggerCls = `${itemCls} data-open:bg-beyen-console-menu-hover data-popup-open:bg-beyen-console-menu-hover`
const subItemCls = "rounded-lg px-3 py-2 text-sm focus:bg-beyen-console-menu-hover"

export default function UserMenu({ collapsed }: { collapsed: boolean }) {
    const { theme, setTheme } = useTheme()
    const { i18n } = useTranslation()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="User menu"
                className="flex h-13 w-full items-center gap-2 rounded-xl p-2 pl-1.5 text-left outline-none transition-all duration-150 hover:bg-beyen-console-sidebar-active hover:shadow-md data-popup-open:bg-beyen-console-sidebar-active data-popup-open:shadow-md"
            >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-sm text-background">
                    T
                </div>
                {!collapsed && (
                    <div className="leading-tight">
                        <div className="text-sm font-medium">support@beyen.com</div>
                        <div className="text-xs opacity-60">admin</div>
                    </div>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-64 rounded-2xl p-1 bg-beyen-console-menu"
            >
                <div className="px-3 py-2 leading-tight">
                    <div className="text-sm text-muted-foreground">support@beyen.com</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        admin
                    </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem className={itemCls}>
                    <CircleUserRound />
                    Profile settings
                </DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className={subTriggerCls}>
                        <Languages />
                        Language
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                        sideOffset={4}
                        className="rounded-xl p-1.5 w-40 bg-beyen-console-menu"
                    >
                        <DropdownMenuRadioGroup
                            value={i18n.resolvedLanguage}
                            onValueChange={(v) => i18n.changeLanguage(v as string)}
                        >
                            {LANGUAGES.map(({ code, label }) => (
                                <DropdownMenuRadioItem
                                    key={code}
                                    value={code}
                                    className={subItemCls}
                                >
                                    {label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className={subTriggerCls}>
                        <Palette />
                        Theme
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                        sideOffset={4}
                        className="rounded-xl p-1.5 w-40 bg-beyen-console-menu"
                    >
                        <DropdownMenuRadioGroup
                            value={theme}
                            onValueChange={(v) =>
                                setTheme(v as "light" | "dark")
                            }
                        >
                            {THEME_OPTIONS.map(({ value, label }) => (
                                <DropdownMenuRadioItem
                                    key={value}
                                    value={value}
                                    className={subItemCls}
                                >
                                    {label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className={itemCls}
                    render={
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noreferrer"
                        />
                    }
                >
                    <Code />
                    Github
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={itemCls}
                    render={<a href="#" target="_blank" rel="noreferrer" />}
                >
                    <Users />
                    Community
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className={itemCls}>
                    <LogOut />
                    Log out
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <div className="pt-1 pb-1 text-center text-xs text-muted-foreground">
                    v1.1.8
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}