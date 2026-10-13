import { Button } from "@/components/ui/button"
import { FaGithub } from "react-icons/fa";
import { Trans, useTranslation } from "react-i18next";
import { useRepoStars } from "@/queries/external/github";
import { formatCompact } from "@/lib/format";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { KeyRound, LaptopMinimal, Network, ScanSearch, UserCog } from 'lucide-react';

const FEATURES = [
    { key: "zeroKeys", icon: KeyRound },
    { key: "decimalMatching", icon: ScanSearch },
    { key: "multiChain", icon: Network },
    { key: "rbac", icon: UserCog },
] as const

export default function LandingPage() {
    const { t } = useTranslation()
    const { data: stars } = useRepoStars("beyenpay/beyen")

    return (
        <>
            <div className="flex flex-col min-h-svh">
                <header className="h-16 px-28">
                    <div className="w-full h-full flex justify-between">
                        <div className="flex items-center gap-6">
                            <a href="/">
                                <img
                                    src="/logo-text-light.svg"
                                    alt="logo"
                                    className="h-6 w-auto block dark:hidden"
                                />

                                <img
                                    src="/logo-text-dark.svg"
                                    alt="logo"
                                    className="h-6 w-auto hidden dark:block "
                                />
                            </a>
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

                            <a href="/console">
                                <Button>
                                    <LaptopMinimal />
                                    <span>{t("landing.console")}</span>
                                </Button>
                            </a>
                        </div>
                    </div>
                </header>

                <main className="relative isolate flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden px-6 text-center">
                    {/* Background: faded grid + soft glow, both follow theme colors */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-56px_56px] opacity-50 mask-[radial-gradient(ellipse_70%_60%_at_50%_45%,#000_30%,transparent_100%)]"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-64 w-3xl -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
                    />

                    <div className="flex flex-col items-center gap-6">
                        <a
                            href="https://github.com/beyenpay/beyen/blob/main/LICENSE"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <span className="size-1.5 rounded-full bg-primary" />
                            {t("landing.badge")}
                        </a>

                        <h1 className="max-w-3xl text-5xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-7xl">
                            {t("landing.title")}
                        </h1>

                        <p className="max-w-xl text-base text-balance text-muted-foreground sm:text-lg">
                            {t("landing.subtitle")}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <a href="/console">
                            <Button size="lg" className="rounded-full px-4">
                                <LaptopMinimal />
                                <span>{t("landing.cta")}</span>
                            </Button>
                        </a>

                        <a
                            href="https://github.com/beyenpay/beyen"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button size="lg" variant="ghost" className="rounded-full px-4">
                                <FaGithub />
                                <span>{t("landing.github")}</span>
                            </Button>
                        </a>
                    </div>

                    <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                        {FEATURES.map(({ key, icon: Icon }) => (
                            <li key={key} className="flex items-center gap-2">
                                <Icon className="size-4" />
                                <span>{t(`landing.features.${key}`)}</span>
                            </li>
                        ))}
                    </ul>
                </main>

                <footer className="px-28 py-10">
                    <div className="text-sm text-muted-foreground flex justify-center">
                        <span>
                            <Trans
                                i18nKey="landing.footer"
                                components={{
                                    site: (
                                        <a
                                            href="https://beyen.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline underline-offset-4 hover:text-foreground transition-colors"
                                        />
                                    ),
                                    repo: (
                                        <a
                                            href="https://github.com/beyenpay/beyen"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline underline-offset-4 hover:text-foreground transition-colors"
                                        />
                                    ),
                                }}
                            />
                        </span>
                    </div>
                </footer>
            </div>
        </>
    )
}