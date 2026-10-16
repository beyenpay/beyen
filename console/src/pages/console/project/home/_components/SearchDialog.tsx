import {
    AudioLines,
    ArrowUpRight,
    Code,
    CreditCard,
    Image as ImageIcon,
    MessageCircle,
    TrendingUp,
    Home,
    Key,
    Settings,
} from "lucide-react"
import { Command as CommandPrimitive } from "cmdk"
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandShortcut,
} from "@/components/ui/command"

const SEARCH_GROUPS = [
    {
        heading: "Suggested",
        items: [
            { label: "Home", icon: Home },
            { label: "Create API Key", icon: Key },
            { label: "Add credits", icon: CreditCard },
            { label: "Usage", icon: TrendingUp },
            { label: "Organization Settings", icon: Settings, arrow: true },
        ],
    },
    {
        heading: "Build",
        items: [
            { label: "Chat", icon: MessageCircle },
            { label: "Audio", icon: AudioLines },
            { label: "Images", icon: ImageIcon },
            { label: "Codex", icon: Code },
        ],
    },
    {
        heading: "Pages",
        items: [
            { label: "API Keys", icon: Key },
            { label: "Settings", icon: Settings },
        ],
    },
]

export default function SearchDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Search"
            description="Search for anything"
            showCloseButton={false}
            className="top-[8%] translate-y-0 rounded-3xl p-0 sm:max-w-3xl bg-beyen-console-surface"
        >
            <Command className="rounded-3xl! bg-beyen-console-surface">
                <CommandPrimitive.Input
                    placeholder="Search for anything..."
                    className="h-14 w-full bg-transparent px-4 outline-none placeholder:text-neutral-400"
                />
                <CommandList className="max-h-[60vh] pb-2">
                    <CommandEmpty>No results found.</CommandEmpty>
                    {SEARCH_GROUPS.map(({ heading, items }) => (
                        <CommandGroup
                            key={heading}
                            heading={heading}
                            className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:text-neutral-400"
                        >
                            {items.map(({ label, icon: Icon, arrow }) => (
                                <CommandItem
                                    key={label}
                                    value={`${heading} ${label}`}
                                    onSelect={() => onOpenChange(false)}
                                    className="cursor-pointer gap-3 rounded-lg px-3 py-2 text-sm hover:bg-beyen-console-search-hover text-muted-foreground"
                                >
                                    <Icon className="size-4.5" />
                                    <span className="">{label}</span>
                                    {arrow && (
                                        <CommandShortcut>
                                            <ArrowUpRight className="size-4" />
                                        </CommandShortcut>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ))}
                </CommandList>
            </Command>
        </CommandDialog>
    )
}

