// Package password hashes and verifies user passwords with argon2id.
package password

import (
	"errors"
	"unicode"
	"unicode/utf8"

	"github.com/alexedwards/argon2id"
)

const (
	MinLen = 8   // characters
	MaxLen = 128 // bytes; bounds the work one request can force

	// Each hash uses 64 MiB, so cap how many run at once.
	maxConcurrent = 8
)

// ErrLength is returned when a new password is too short or too long.
var (
	ErrLength = errors.New("password must be 8 to 128 characters")
	ErrWeak   = errors.New("password must contain at least one letter and one digit")
)

var params = &argon2id.Params{
	Memory:      64 * 1024, // KiB, so 64 MiB
	Iterations:  3,
	Parallelism: 2,
	SaltLength:  16,
	KeyLength:   32,
}

var sem = make(chan struct{}, maxConcurrent)

// dummyHash lets a login for an unknown email cost the same as a real one.
var dummyHash, _ = argon2id.CreateHash("dummy-password", params)

// Validate checks the policy for a new password: 8 to 128 characters with at
// least one letter and one digit.
func Validate(plain string) error {
	if utf8.RuneCountInString(plain) < MinLen || len(plain) > MaxLen {
		return ErrLength
	}
	var letter, digit bool
	for _, r := range plain {
		switch {
		case unicode.IsLetter(r):
			letter = true
		case unicode.IsDigit(r):
			digit = true
		}
	}
	if !letter || !digit {
		return ErrWeak
	}
	return nil
}

// Hash returns a self-describing argon2id hash. It only enforces the upper
// bound; the password policy is Validate's job and applies to new passwords.
func Hash(plain string) (string, error) {
	if len(plain) > MaxLen {
		return "", ErrLength
	}
	sem <- struct{}{}
	defer func() { <-sem }()
	return argon2id.CreateHash(plain, params)
}

// Verify reports whether plain matches hash. Oversized input never matches.
func Verify(plain, hash string) (bool, error) {
	if len(plain) > MaxLen {
		return false, nil
	}
	sem <- struct{}{}
	defer func() { <-sem }()
	return argon2id.ComparePasswordAndHash(plain, hash)
}

// DummyVerify burns the same time as Verify. Call it when the user is not found.
func DummyVerify(plain string) {
	_, _ = Verify(plain, dummyHash)
}

// NeedsRehash reports whether hash was made with weaker parameters than the
// current ones. Re-hash after a successful login when it returns true.
func NeedsRehash(hash string) bool {
	p, _, _, err := argon2id.DecodeHash(hash)
	if err != nil {
		return true
	}
	return p.Memory != params.Memory || p.Iterations != params.Iterations || p.Parallelism != params.Parallelism
}
