import { toast } from "@/components/ui/toast"
import i18n from "@/i18n"

// Copies text and tells the user. Returns whether it worked: the clipboard API
// is only available on HTTPS and on localhost.
export async function copyText(text: string, message: string) {
    try {
        await navigator.clipboard.writeText(text)
        toast.add({ type: "success", title: message })
        return true
    } catch {
        toast.add({ type: "error", title: i18n.t("dataTable.copyFailed") })
        return false
    }
}
