import { LaptopMinimal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { FaGithub } from "react-icons/fa"
import { Link } from "react-router"

import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { Button } from "@/components/ui/button"
import { formatCompact } from "@/lib/format"
import { useRepoStars } from "@/queries/external/github"

// Shared by every layout that wants the site chrome; it belongs to no layout.
export function SiteHeader() {
    const { t } = useTranslation()
    const { data: stars } = useRepoStars("beyenpay/beyen")

    return (
        <header className="h-16 px-28">
            <div className="w-full h-full flex justify-between">
                <div className="flex items-center gap-6">
                    <Link to="/">
                        <img
                            src="/logo-text-light.svg"
                            alt="logo"
                            className="h-6 w-auto block dark:hidden"
                        />

                        <img
                            src="/logo-text-dark.svg"
                            alt="logo"
                            className="h-6 w-auto hidden dark:block"
                        />
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href="https://github.com/beyenpay/beyen"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button variant="ghost" className="flex gap-2">
                            <FaGithub />
                            {stars !== undefined && (
                                <span className="font-mono text-xs text-muted-foreground">
                                    {formatCompact(stars)}
                                </span>
                            )}
                        </Button>
                    </a>

                    <div className="h-4 w-px bg-border" />

                    <ThemeToggle />

                    <div className="h-4 w-px bg-border" />

                    <LanguageSwitcher />

                    <div className="h-5 w-px bg-border" />

                    <Button render={<Link to="/console" />} nativeButton={false}>
                        <LaptopMinimal />
                        <span>{t("site.console")}</span>
                    </Button>
                </div>
            </div>
        </header>
    )
}
