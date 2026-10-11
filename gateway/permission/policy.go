package permission

import "github.com/beyenpay/beyen/gateway/model"

// Tiers are composed here at build time only. At runtime every role holds a
// flat, fully expanded set, so a role can diverge later by editing its own
// list. A new permission is denied to every role until it is listed below.
var (
	supportPerms = []Permission{
		ProjectHomeRead,
		ProjectWalletRead,
		ProjectTransactionRead, ProjectTransactionWrite,
		ProjectCustomerRead, ProjectCustomerWrite,
		ProjectStatsRead,
	}

	developerPerms = concat(supportPerms, []Permission{
		ProjectAPIKeyRead, ProjectAPIKeyWrite,
		ProjectWebhookRead, ProjectWebhookWrite,
	})

	managerPerms = concat(developerPerms, []Permission{
		ProjectSettingsRead, ProjectSettingsWrite,
		ProjectMemberRead, ProjectMemberWrite,
	})

	systemPerms = []Permission{
		SystemOverviewRead,
		SystemProjectRead, SystemProjectWrite,
		SystemUserRead, SystemUserWrite,
		SystemProviderRead, SystemProviderWrite,
		SystemHealthRead,
		SystemInstanceRead, SystemInstanceWrite,
	}

	// Admin reaches every project implicitly, so it also holds all project
	// permissions and needs no project_members row.
	adminPerms = concat(systemPerms, managerPerms)
)

// grant keeps the declared order for listing and a set for O(1) lookups.
type grant struct {
	list []Permission
	set  map[Permission]struct{}
}

func newGrant(list []Permission) grant {
	set := make(map[Permission]struct{}, len(list))
	for _, p := range list {
		set[p] = struct{}{}
	}
	return grant{list: list, set: set}
}

var (
	projectRoles = map[model.ProjectRole]grant{
		model.ProjectRoleSupport:   newGrant(supportPerms),
		model.ProjectRoleDeveloper: newGrant(developerPerms),
		model.ProjectRoleManager:   newGrant(managerPerms),
	}
	systemRoles = map[model.SystemRole]grant{
		model.SystemRoleAdmin: newGrant(adminPerms),
	}
)

// ProjectRoleCan reports whether a project role holds p. Unknown roles hold nothing.
func ProjectRoleCan(role model.ProjectRole, p Permission) bool {
	_, ok := projectRoles[role].set[p]
	return ok
}

// SystemRoleCan reports whether a system role holds p. The empty role holds nothing.
func SystemRoleCan(role model.SystemRole, p Permission) bool {
	_, ok := systemRoles[role].set[p]
	return ok
}

// ProjectRolePermissions returns a copy of the permissions held by a project role.
func ProjectRolePermissions(role model.ProjectRole) []Permission {
	return append([]Permission(nil), projectRoles[role].list...)
}

// SystemRolePermissions returns a copy of the permissions held by a system role.
func SystemRolePermissions(role model.SystemRole) []Permission {
	return append([]Permission(nil), systemRoles[role].list...)
}

func concat(groups ...[]Permission) []Permission {
	var out []Permission
	for _, g := range groups {
		out = append(out, g...)
	}
	return out
}
