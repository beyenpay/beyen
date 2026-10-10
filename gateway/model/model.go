package model

// All lists every table model. Add new models here and they are migrated.
func All() []any {
	return []any{
		&User{},
		&Role{},
		&UserRole{},
	}
}
