import { Button } from "@/components/ui/button"
import { FaGithub } from "react-icons/fa";
import { LaptopMinimal } from 'lucide-react';

export default function HomePage() {
    return (
        <>
            <div className="flex flex-col">
                <header className="h-16 px-28 border">
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

                        <div className="flex items-center gap-1">
                            <a href="https://github.com/beyenpay/beyen" target="_blank">
                                <Button variant={"secondary"}>
                                    <FaGithub />
                                    <span>Github</span>
                                </Button>
                            </a>

                            <a href="/console">
                                <Button>
                                    <LaptopMinimal />
                                    <span>Console</span>
                                </Button>
                            </a>
                        </div>
                    </div>
                </header>

                <main className="px-28 py-4 border">
                    <div className="rounded-lg overflow-hidden">
                        main
                    </div>
                </main>

                <footer className="px-28 py-10 border">
                    <div className="flex justify-between gap-2">
                        <div className="text-muted-foreground text-sm">© {new Date().getFullYear()} Beyen. All rights reserved.</div>

                        <div className="flex gap-4">
                            <a href="https://github.com/beyenpay" target="_blank"><FaGithub size={20} /></a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    )
}