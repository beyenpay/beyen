package console

// ProjectAccess is one project the user belongs to. Status is 1 active or 2
// disabled; permissions are empty unless the project is active.
type ProjectAccess struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	Status      int      `json:"status"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
}

// PermissionsResponse is what the frontend renders menus and buttons from.
// For an admin, System also holds every project.* permission, valid in any project.
type PermissionsResponse struct {
	System   []string        `json:"system"`
	Projects []ProjectAccess `json:"projects"`
}

type SessionInfo struct {
	ID         string `json:"id"`
	IP         string `json:"ip"`
	UserAgent  string `json:"user_agent"`
	CreatedAt  int64  `json:"created_at"`
	LastSeenAt int64  `json:"last_seen_at"`
	Current    bool   `json:"current"`
}
