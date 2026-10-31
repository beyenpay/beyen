package console

type SetupStatusResponse struct {
	NeedsSetup bool `json:"needs_setup"`
}

// SetupRequest has no confirm field: the console checks the two passwords match.
type SetupRequest struct {
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,max=128"`
}
