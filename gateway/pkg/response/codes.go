package response

// Codes are stable identifiers. The console frontend maps them to translated
// messages, so never rename or reuse one once the frontend depends on it.
// Add a code only when something actually returns it.

// Generic codes, handled centrally by the frontend interceptor.
const (
	CodeBadRequest         = "BAD_REQUEST"
	CodeInvalidParams      = "INVALID_PARAMS" // body binding or validation failed
	CodeUnauthorized       = "UNAUTHORIZED"
	CodePermissionDenied   = "PERMISSION_DENIED"
	CodeNotFound           = "NOT_FOUND"          // a resource does not exist
	CodeEndpointNotFound   = "ENDPOINT_NOT_FOUND" // no such route
	CodeMethodNotAllowed   = "METHOD_NOT_ALLOWED"
	CodeAlreadyLoggedIn    = "ALREADY_LOGGED_IN" // login attempted with a valid session
	CodeRateLimited        = "RATE_LIMITED"
	CodeInternalError      = "INTERNAL_ERROR"
	CodeServiceUnavailable = "SERVICE_UNAVAILABLE"
)

// Business codes, handled by the page that made the call.
const (
	CodeInvalidCredentials = "INVALID_CREDENTIALS" // wrong email or password
	CodeAccountDisabled    = "ACCOUNT_DISABLED"
	CodeTooManyAttempts    = "TOO_MANY_ATTEMPTS" // login attempts throttled
	CodeProjectDisabled    = "PROJECT_DISABLED"  // the project is frozen by a platform admin
	CodeSetupCompleted     = "SETUP_COMPLETED"   // first-run setup attempted while users already exist
	CodeWeakPassword       = "WEAK_PASSWORD"     // new password breaks the password policy
	CodeEmailTaken         = "EMAIL_TAKEN"       // creating a user whose email is already registered
)
