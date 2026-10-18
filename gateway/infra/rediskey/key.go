// Package rediskey is the single place where Redis keys are named.
// Every key is {app}:{domain}:{kind}:{id}, so scanning one prefix shows
// everything this app owns, even on a Redis shared with other projects.
package rediskey

import "strconv"

// Keys builds Redis keys. Create it once from config.App.Name and pass it down.
type Keys struct{ prefix string }

func New(appName string) Keys { return Keys{prefix: appName} }

// Session is the session record, addressed by the SHA-256 of the cookie value.
func (k Keys) Session(idHash string) string { return k.prefix + ":session:" + idHash }

// UserSessions is the per-user index of live sessions.
func (k Keys) UserSessions(userID int) string {
	return k.prefix + ":user:sessions:" + strconv.Itoa(userID)
}

// RateLimit is one token bucket. scope names the limiter, id names the caller.
func (k Keys) RateLimit(scope, id string) string {
	return k.prefix + ":ratelimit:" + scope + ":" + id
}

// ProjectInfo caches a project's status.
func (k Keys) ProjectInfo(projectID int) string {
	return k.prefix + ":project:info:" + strconv.Itoa(projectID)
}

// ProjectMember caches one user's role in one project.
func (k Keys) ProjectMember(projectID, userID int) string {
	return k.prefix + ":project:member:" + strconv.Itoa(projectID) + ":" + strconv.Itoa(userID)
}

// UserMe caches the data behind GET /me for one user: email and project memberships.
func (k Keys) UserMe(userID int) string { return k.prefix + ":user:me:" + strconv.Itoa(userID) }

// ProjectList caches every non-deleted project (id, name, status): the list a
// platform admin sees in GET /me. One key shared by all admins.
func (k Keys) ProjectList() string { return k.prefix + ":project:list" }
