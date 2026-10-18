import type { ParseKeys } from "i18next"
import {
    ArrowLeftRight,
    Code,
    Home,
    Server,
    Settings,
    TrendingUp,
    Users,
    Wallet,
    type LucideIcon,
} from "lucide-react"

import { PERMISSIONS, type Permission } from "@/constants/permissions"

// One page inside a section, shown as a tab (L3).
export type NavTab = {
    path: string
    label: ParseKeys
    permission?: Permission
}

// One sidebar entry. With tabs it is a page that switches between them; the
// first tab must need no more permission than the section itself, because
// the section links to it.
export type NavSection = {
    path: string // under its base; may hold :projectId
    label: ParseKeys
    permission?: Permission
    tabs?: NavTab[]
    // Only the main sidebar has icons; the sub sidebars leave this out.
    icon?: LucideIcon
    // The lowest role that unlocks this entry, shown as a tag beside it.
    tag?: ParseKeys
}

// A sub sidebar (L2): replaces the main one while its pages are open.
export type SubNav = {
    path: string // under /console
    sections: NavSection[]
}

// Main sidebar, in order. Paths are under /console.
export const PROJECT_NAV: NavSection[] = [
    { path: "home", label: "nav.home", icon: Home, permission: PERMISSIONS.projectHomeRead },
    { path: "wallet", label: "nav.wallet", icon: Wallet, permission: PERMISSIONS.projectWalletRead },
    { path: "transactions", label: "nav.transactions", icon: ArrowLeftRight, permission: PERMISSIONS.projectTransactionRead },
    { path: "customers", label: "nav.customers", icon: Users, permission: PERMISSIONS.projectCustomerRead },
    { path: "stats", label: "nav.stats", icon: TrendingUp, permission: PERMISSIONS.projectStatsRead },
    {
        path: "developer",
        label: "nav.developer",
        icon: Code,
        permission: PERMISSIONS.projectApiKeyRead,
        tag: "role.developer",
        tabs: [
            { path: "api-keys", label: "nav.apiKeys", permission: PERMISSIONS.projectApiKeyRead },
            { path: "webhooks", label: "nav.webhooks", permission: PERMISSIONS.projectWebhookRead },
        ],
    },
    {
        path: "settings/:projectId",
        label: "nav.projectSettings",
        icon: Settings,
        permission: PERMISSIONS.projectSettingsRead,
        tag: "role.manager",
        tabs: [
            { path: "general", label: "nav.general", permission: PERMISSIONS.projectSettingsRead },
            { path: "brand", label: "nav.brand", permission: PERMISSIONS.projectSettingsRead },
            { path: "payment", label: "nav.payment", permission: PERMISSIONS.projectSettingsRead },
            { path: "members", label: "nav.members", permission: PERMISSIONS.projectMemberRead },
            { path: "danger", label: "nav.dangerZone", permission: PERMISSIONS.projectSettingsRead },
        ],
    },
]

// Opens the system console sub sidebar. Not part of PROJECT_NAV: the routes of
// that sub sidebar come from SUB_NAVS, so listing it in both would register
// /console/system/overview twice.
export const SYSTEM_ENTRY: NavSection = {
    path: "system/overview",
    label: "nav.systemConsole",
    icon: Server,
    permission: PERMISSIONS.systemOverviewRead,
    tag: "role.admin",
}

// Everything the main sidebar lists, in order.
export const ROOT_NAV: NavSection[] = [...PROJECT_NAV, SYSTEM_ENTRY]

const SYSTEM_NAV: NavSection[] = [
    { path: "overview", label: "nav.overview", permission: PERMISSIONS.systemOverviewRead },
    { path: "projects", label: "nav.projects", permission: PERMISSIONS.systemProjectRead },
    { path: "users", label: "nav.users", permission: PERMISSIONS.systemUserRead },
    {
        path: "providers",
        label: "nav.providers",
        permission: PERMISSIONS.systemProviderRead,
        tabs: [
            { path: "rpc", label: "nav.providerRpc" },
            { path: "token-price", label: "nav.providerTokenPrice" },
            { path: "fiat-rate", label: "nav.providerFiatRate" },
        ],
    },
    {
        path: "health",
        label: "nav.health",
        permission: PERMISSIONS.systemHealthRead,
        tabs: [
            { path: "upstream", label: "nav.healthUpstream" },
            { path: "system", label: "nav.healthSystem" },
            { path: "nodes", label: "nav.healthNodes" },
            { path: "blockchain", label: "nav.healthBlockchain" },
        ],
    },
    {
        path: "instance",
        label: "nav.instance",
        permission: PERMISSIONS.systemInstanceRead,
        tabs: [
            { path: "smtp", label: "nav.instanceSmtp" },
            { path: "alert", label: "nav.instanceAlert" },
            { path: "others", label: "nav.instanceOthers" },
        ],
    },
]

// Account pages concern the user, not a project: no permission needed.
const ACCOUNT_NAV: NavSection[] = [
    { path: "profile", label: "nav.profile" },
    { path: "password", label: "nav.password" },
    { path: "sessions", label: "nav.sessions" },
    { path: "notifications", label: "nav.notifications" },
    { path: "appearance", label: "nav.appearance" },
    { path: "my-projects", label: "nav.myProjects" },
    { path: "danger", label: "nav.dangerZone" },
]

export const SUB_NAVS: SubNav[] = [
    { path: "system", sections: SYSTEM_NAV },
    { path: "account", sections: ACCOUNT_NAV },
]
