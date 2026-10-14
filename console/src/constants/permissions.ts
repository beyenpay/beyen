// Mirrors gateway/permission/permission.go, which is the source of truth.
// Keep the two in sync: this file only lets route configs and menus refer to
// permissions without typos.
export const PERMISSIONS = {
    // Project level: each module maps to a sidebar entry.
    projectHomeRead: "project.home:read",
    projectWalletRead: "project.wallet:read",
    projectTransactionRead: "project.transaction:read",
    projectTransactionWrite: "project.transaction:write",
    projectCustomerRead: "project.customer:read",
    projectCustomerWrite: "project.customer:write",
    projectStatsRead: "project.stats:read",
    projectApiKeyRead: "project.api_key:read",
    projectApiKeyWrite: "project.api_key:write",
    projectWebhookRead: "project.webhook:read",
    projectWebhookWrite: "project.webhook:write",
    projectSettingsRead: "project.settings:read",
    projectSettingsWrite: "project.settings:write",
    projectMemberRead: "project.member:read",
    projectMemberWrite: "project.member:write",

    // System console: only platform admins hold these.
    systemOverviewRead: "system.overview:read",
    systemProjectRead: "system.project:read",
    systemProjectWrite: "system.project:write",
    systemUserRead: "system.user:read",
    systemUserWrite: "system.user:write",
    systemProviderRead: "system.provider:read",
    systemProviderWrite: "system.provider:write",
    systemHealthRead: "system.health:read",
    systemInstanceRead: "system.instance:read",
    systemInstanceWrite: "system.instance:write",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Same rule as the gateway's Permission.IsSystem.
export function isSystemPermission(permission: Permission) {
    return permission.startsWith("system.")
}