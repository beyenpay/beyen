package bootstrap

import (
	"fmt"

	"gorm.io/gorm"

	"github.com/beyenpay/beyen/gateway/model"
)

// seedRoles inserts the built-in roles that are missing. Existing rows are
// left untouched, so it is safe to run on every start.
func seedRoles(gdb *gorm.DB) error {
	roles := []model.Role{
		{Code: model.RoleCodeAdmin, Scope: model.RoleScopeSystem},
		{Code: model.RoleCodeManager, Scope: model.RoleScopeProject},
		{Code: model.RoleCodeDeveloper, Scope: model.RoleScopeProject},
		{Code: model.RoleCodeSupport, Scope: model.RoleScopeProject},
	}
	for _, r := range roles {
		if err := gdb.Where("code = ?", r.Code).FirstOrCreate(&r).Error; err != nil {
			return fmt.Errorf("seed role %q: %w", r.Code, err)
		}
	}
	return nil
}
