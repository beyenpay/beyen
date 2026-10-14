import { Trans } from "react-i18next"

const LINK_CLASS = "underline underline-offset-4 hover:text-foreground transition-colors"

// Shared by every layout that wants the site chrome; it belongs to no layout.
export function SiteFooter() {
    return (
        <footer className="px-28 py-10">
            <div className="text-sm text-muted-foreground flex justify-center">
                <span>
                    <Trans
                        i18nKey="site.footer"
                        components={{
                            site: (
                                <a
                                    href="https://beyen.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={LINK_CLASS}
                                />
                            ),
                            repo: (
                                <a
                                    href="https://github.com/beyenpay/beyen"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={LINK_CLASS}
                                />
                            ),
                        }}
                    />
                </span>
            </div>
        </footer>
    )
}