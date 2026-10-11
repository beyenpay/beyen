// Package repository is the data access layer. It stores and loads records
// and holds no business rules.
package repository

import "errors"

var (
	// ErrNotFound is returned when the requested record does not exist.
	ErrNotFound = errors.New("repository: not found")
	// ErrDuplicate is returned when a unique index rejects an insert.
	ErrDuplicate = errors.New("repository: duplicate")
)
