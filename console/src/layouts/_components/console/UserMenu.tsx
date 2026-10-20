
import {
    Languages,
    LogOut,
    Palette,
    Users,
    CircleUserRound,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
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
import { FaGithub } from "react-icons/fa"
import type { ParseKeys } from "i18next"
import { useCurrentProject } from "@/hooks/useCurrentProject"
import { useLogout } from "@/queries/console/auth/auth"
import { useMe } from "@/queries/console/auth/me"

const THEME_OPTIONS = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
]

const itemCls = "gap-3 rounded-lg px-3 py-2 text-sm focus:bg-beyen-console-menu-hover"
const subTriggerCls = `${itemCls} data-open:bg-beyen-console-menu-hover data-popup-open:bg-beyen-console-menu-hover`
const subItemCls = "rounded-lg px-3 py-2 text-sm focus:bg-beyen-console-menu-hover"

const ROLE_KEYS: Record<string, ParseKeys> = {
    admin: "role.admin",
    manager: "role.manager",
    developer: "role.developer",
    support: "role.support",
}

// An admin is an admin everywhere; anyone else shows their role in the current
// project, and nothing when they have no project.
function useAccount() {
    const { data: me } = useMe()
    const { project } = useCurrentProject()
    const role = me?.user.system_role || project?.role
    return { email: me?.user.email ?? "", roleKey: role ? ROLE_KEYS[role] : undefined }
}

export default function UserMenu({ collapsed }: { collapsed: boolean }) {
    const { theme, setTheme } = useTheme()
    const { t, i18n } = useTranslation()
    const { email, roleKey } = useAccount()
    const logout = useLogout()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="User menu"
                className="flex h-13 w-full items-center gap-2 rounded-xl p-2 pl-1.5 text-left outline-none transition-all duration-150 hover:bg-beyen-console-sidebar-active hover:shadow-md data-popup-open:bg-beyen-console-sidebar-active data-popup-open:shadow-md"
            >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-sm text-background">
                    {email.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                    <div className="min-w-0 leading-tight">
                        <div className="truncate text-sm font-medium">{email}</div>
                        {roleKey && <div className="text-xs opacity-60">{t(roleKey)}</div>}
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
                    <div className="truncate text-sm text-muted-foreground">{email}</div>
                    {roleKey && (
                        <div className="mt-1 text-xs text-muted-foreground">{t(roleKey)}</div>
                    )}
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className={itemCls}
                    render={<Link to="/console/account/profile" />}
                >
                    <CircleUserRound />
                    Account settings
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
                            href="https://github.com/beyenpay/beyen"
                            target="_blank"
                            rel="noreferrer"
                        />
                    }
                >
                    <FaGithub />
                    Github
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={itemCls}
                    render={<a href="/" target="_blank" rel="noreferrer" />}
                >
                    <Users />
                    Community
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className={itemCls}
                    disabled={logout.isPending}
                    onClick={() => logout.mutate()}
                >
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