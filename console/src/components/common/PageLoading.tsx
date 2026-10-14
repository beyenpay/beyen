import { Loader2Icon } from "lucide-react"

export function PageLoading() {
    return (
        <div className="flex min-h-svh items-center justify-center text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />
        </div>
    )
}