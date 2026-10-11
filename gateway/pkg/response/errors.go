package response

import "net/http"

// Error is a fixed API error: HTTP status, stable code and an English fallback
// message. The frontend translates by Code; Message is for debugging.
type Error struct {
	Status  int
	Code    string
	Message string
}

// WithMessage returns a copy of e with a different fallback message. The
// status and code stay the same, so the frontend handles it identically.
func (e Error) WithMessage(msg string) Error {
	e.Message = msg
	return e
}

// Generic errors.
var (
	ErrBadRequest       = Error{http.StatusBadRequest, CodeBadRequest, "bad request"}
	ErrInvalidParams    = Error{http.StatusBadRequest, CodeInvalidParams, "invalid parameters"}
	ErrUnauthorized     = Error{http.StatusUnauthorized, CodeUnauthorized, "unauthorized"}
	ErrForbidden        = Error{http.StatusForbidden, CodePermissionDenied, "permission denied"}
	ErrNotFound         = Error{http.StatusNotFound, CodeNotFound, "not found"}
	ErrEndpointNotFound = Error{http.StatusNotFound, CodeEndpointNotFound, "endpoint not found"}
	ErrMethodNotAllowed = Error{http.StatusMethodNotAllowed, CodeMethodNotAllowed, "method not allowed"}
	ErrAlreadyLoggedIn  = Error{http.StatusConflict, CodeAlreadyLoggedIn, "already logged in"}
	ErrRateLimited      = Error{http.StatusTooManyRequests, CodeRateLimited, "too many requests"}
	ErrInternal         = Error{http.StatusInternalServerError, CodeInternalError, "internal server error"}
	ErrUnavailable      = Error{http.StatusServiceUnavailable, CodeServiceUnavailable, "service unavailable"}
)

// Business errors.
var (
	ErrInvalidCredentials = Error{http.StatusUnauthorized, CodeInvalidCredentials, "invalid email or password"}
	ErrAccountDisabled    = Error{http.StatusForbidden, CodeAccountDisabled, "account is disabled"}
	ErrTooManyAttempts    = Error{http.StatusTooManyRequests, CodeTooManyAttempts, "too many attempts, try again later"}
	ErrProjectDisabled    = Error{http.StatusForbidden, CodeProjectDisabled, "project is disabled"}
)
