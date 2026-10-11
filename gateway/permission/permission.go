// Package permission defines every permission code and which role holds it.
// Callers ask "may this user do X", never "is this user a manager".
package permission

import "strings"

// Permission is written as "<scope>.<module>:<action>".
type Permission string

// IsSystem reports whether p belongs to the system console.
func (p Permission) IsSystem() bool { return strings.HasPrefix(string(p), "system.") }

// Project-level permissions. Each module maps to an entry in the project sidebar.
const (
	ProjectHomeRead Permission = "project.home:read" // Home

	ProjectWalletRead Permission = "project.wallet:read" // Wallet

	ProjectTransactionRead  Permission = "project.transaction:read" // Transactions
	ProjectTransactionWrite Permission = "project.transaction:write"

	ProjectCustomerRead  Permission = "project.customer:read" // Customers
	ProjectCustomerWrite Permission = "project.customer:write"

	ProjectStatsRead Permission = "project.stats:read" // Stats

	ProjectAPIKeyRead  Permission = "project.api_key:read" // Developer / API Keys
	ProjectAPIKeyWrite Permission = "project.api_key:write"

	ProjectWebhookRead  Permission = "project.webhook:read" // Developer / Webhooks
	ProjectWebhookWrite Permission = "project.webhook:write"

	ProjectSettingsRead  Permission = "project.settings:read" // Project Settings: General, Brand, Payment Method
	ProjectSettingsWrite Permission = "project.settings:write"

	ProjectMemberRead  Permission = "project.member:read" // Project Settings: Members
	ProjectMemberWrite Permission = "project.member:write"
)

// System-console permissions. Only platform admins hold them.
const (
	SystemOverviewRead Permission = "system.overview:read" // Overview

	SystemProjectRead  Permission = "system.project:read" // Projects; write covers freezing and deleting
	SystemProjectWrite Permission = "system.project:write"

	SystemUserRead  Permission = "system.user:read" // Users
	SystemUserWrite Permission = "system.user:write"

	SystemProviderRead  Permission = "system.provider:read" // Upstream Providers: Blockchain, Token Price, Fiat Rate
	SystemProviderWrite Permission = "system.provider:write"

	SystemHealthRead Permission = "system.health:read" // Health Monitoring

	SystemInstanceRead  Permission = "system.instance:read" // Instance Settings: SMTP, Alert, Others
	SystemInstanceWrite Permission = "system.instance:write"
)
