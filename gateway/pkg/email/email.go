// Package email normalizes and validates email addresses.
package email

import (
	"strings"

	"github.com/go-playground/validator/v10"
)

// The same library gin uses for `binding:"email"`, so HTTP and service agree.
var v = validator.New()

const maxLen = 255 // the users.email column size

// Normalize returns the canonical form stored and looked up: trimmed, lower case.
func Normalize(s string) string { return strings.ToLower(strings.TrimSpace(s)) }

// Valid reports whether s, already normalized, is a well-formed address.
func Valid(s string) bool {
	return len(s) <= maxLen && v.Var(s, "required,email") == nil
}
