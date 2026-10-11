// Package token creates and fingerprints high-entropy random tokens, such as
// session ids and API keys.
package token

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
)

const byteLen = 32 // 256 bits

// New returns a random token: 32 bytes as 43 base64url characters.
func New() string {
	b := make([]byte, byteLen)
	rand.Read(b) // never fails since Go 1.24: it crashes the process instead
	return base64.RawURLEncoding.EncodeToString(b)
}

// Hash returns the hex SHA-256 of a token. Store and look up this value,
// never the token itself. No salt: the token already has 256 bits of
// randomness and lookups need a deterministic value.
func Hash(tok string) string {
	sum := sha256.Sum256([]byte(tok))
	return hex.EncodeToString(sum[:])
}
