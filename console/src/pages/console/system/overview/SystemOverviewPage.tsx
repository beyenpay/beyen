import { ToneBadge } from "@/components/common/ToneBadge";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, BookmarkIcon } from "lucide-react"

export default function SystemOverviewPage() {

    return (
        <>
            <div>system overview</div>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Badge variant="default">badget</Badge>
                    <Badge variant="destructive">badget</Badge>
                    <Badge variant="ghost">badget</Badge>
                    <Badge variant="link">badget</Badge>
                    <Badge variant="outline">badget</Badge>
                    <Badge variant="secondary">badget</Badge>
                </div>
                <div className="flex gap-2">
                    <Badge variant="secondary">
                        <BadgeCheck data-icon="inline-start" />
                        Verified
                    </Badge>
                    <Badge variant="outline">
                        Bookmark
                        <BookmarkIcon data-icon="inline-end" />
                    </Badge>
                </div>
                <div className="flex gap-2">
                    <ToneBadge>badget</ToneBadge>
                    <ToneBadge tone="gray">badget</ToneBadge>
                    <ToneBadge tone="green">badget</ToneBadge>
                    <ToneBadge tone="blue">badget</ToneBadge>
                    <ToneBadge tone="red">badget</ToneBadge>
                    <ToneBadge tone="purple">badget</ToneBadge>
                </div>
            </div>
        </>
    )
}