package console

import (
	"errors"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	consoledto "github.com/beyenpay/beyen/gateway/dto/console"
	"github.com/beyenpay/beyen/gateway/middleware"
	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/beyen/gateway/service/user"
	"github.com/beyenpay/x/logger"
)

type UserHandler struct {
	svc *user.Service
}

func NewUserHandler(svc *user.Service) *UserHandler {
	return &UserHandler{svc: svc}
}

// List handles GET /api/console/system/users.
func (h *UserHandler) List(c *gin.Context) {
	var req consoledto.ListUsersRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	roles, ok := req.RoleList()
	if !ok || (req.CreatedFrom > 0 && req.CreatedTo > 0 && req.CreatedFrom > req.CreatedTo) {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	res, err := h.svc.List(c.Request.Context(), user.ListInput{
		Page:        req.Page,
		PageSize:    req.PageSize,
		Sort:        req.Sort,
		SortDesc:    req.Dir != "asc",
		Email:       req.Q,
		EmailExact:  req.QOp == "eq",
		Comment:     req.Comment,
		Status:      model.UserStatus(req.Status),
		Roles:       roles,
		CreatedFrom: req.CreatedFrom,
		CreatedTo:   req.CreatedTo,
	})
	if errors.Is(err, user.ErrInvalidSort) {
		response.Fail(c, response.ErrInvalidParams)
		return
	}
	if err != nil {
		logger.Error("list users failed", zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}

	items := make([]consoledto.UserListItem, len(res.Users)) // never nil: the JSON must say [] not null
	for i := range res.Users {
		items[i] = consoledto.NewUserListItem(&res.Users[i])
	}
	response.Success(c, consoledto.Page[consoledto.UserListItem]{
		Items:    items,
		Total:    res.Total,
		Page:     res.Page,
		PageSize: res.PageSize,
	})
}

// Create handles POST /api/console/system/users.
func (h *UserHandler) Create(c *gin.Context) {
	var req consoledto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	u, err := h.svc.Create(c.Request.Context(), user.CreateInput{
		Email:      req.Email,
		Password:   req.Password,
		SystemRole: model.SystemRole(req.SystemRole),
		Comment:    req.Comment,
	})
	switch {
	case err == nil:
	case errors.Is(err, user.ErrEmailTaken):
		response.Fail(c, response.ErrEmailTaken)
		return
	case errors.Is(err, user.ErrWeakPassword):
		response.Fail(c, response.ErrWeakPassword)
		return
	case errors.Is(err, user.ErrInvalidEmail), errors.Is(err, user.ErrInvalidRole), errors.Is(err, user.ErrInvalidComment):
		response.Fail(c, response.ErrInvalidParams)
		return
	default:
		logger.Error("create user failed", zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}

	// Ids only: the email stays out of the log. RequireLogin guarantees a principal.
	logger.Info("user created",
		zap.Int("user_id", u.ID),
		zap.Int("by", middleware.PrincipalFrom(c).UserID),
		zap.String("system_role", string(u.SystemRole)),
	)
	response.Success(c, consoledto.NewUserListItem(u))
}

// Update handles PATCH /api/console/system/users/:id.
func (h *UserHandler) Update(c *gin.Context) {
	var uri consoledto.UserIDURI
	var req consoledto.UpdateUserRequest
	if c.ShouldBindUri(&uri) != nil || c.ShouldBindJSON(&req) != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	in := user.UpdateInput{
		ID:      uri.ID,
		ActorID: middleware.PrincipalFrom(c).UserID,
		Email:   req.Email,
		Comment: req.Comment,
	}
	if req.SystemRole != nil {
		role := model.SystemRole(*req.SystemRole)
		in.SystemRole = &role
	}
	if req.Status != nil {
		status := model.UserStatus(*req.Status)
		in.Status = &status
	}

	u, err := h.svc.Update(c.Request.Context(), in)
	if err != nil {
		failManage(c, "update user", err)
		return
	}

	logger.Info("user updated", zap.Int("user_id", u.ID), zap.Int("by", in.ActorID))
	response.Success(c, consoledto.NewUserListItem(u))
}

// Delete handles DELETE /api/console/system/users/:id. The user is marked
// deleted, not removed; see user.Service.Delete.
func (h *UserHandler) Delete(c *gin.Context) {
	var uri consoledto.UserIDURI
	if c.ShouldBindUri(&uri) != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	by := middleware.PrincipalFrom(c).UserID
	if err := h.svc.Delete(c.Request.Context(), uri.ID, by); err != nil {
		failManage(c, "delete user", err)
		return
	}

	logger.Info("user deleted", zap.Int("user_id", uri.ID), zap.Int("by", by))
	response.Success(c, nil)
}

// Restore handles POST /api/console/system/users/:id/restore.
func (h *UserHandler) Restore(c *gin.Context) {
	var uri consoledto.UserIDURI
	if c.ShouldBindUri(&uri) != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	u, err := h.svc.Restore(c.Request.Context(), uri.ID)
	if err != nil {
		failManage(c, "restore user", err)
		return
	}

	logger.Info("user restored", zap.Int("user_id", u.ID), zap.Int("by", middleware.PrincipalFrom(c).UserID))
	response.Success(c, consoledto.NewUserListItem(u))
}

// ResetPassword handles POST /api/console/system/users/:id/password.
func (h *UserHandler) ResetPassword(c *gin.Context) {
	var uri consoledto.UserIDURI
	var req consoledto.ResetPasswordRequest
	if c.ShouldBindUri(&uri) != nil || c.ShouldBindJSON(&req) != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	by := middleware.PrincipalFrom(c).UserID
	if err := h.svc.ResetPassword(c.Request.Context(), uri.ID, by, req.Password); err != nil {
		failManage(c, "reset user password", err)
		return
	}

	// Never log the password, or anything derived from it.
	logger.Info("user password reset", zap.Int("user_id", uri.ID), zap.Int("by", by))
	response.Success(c, nil)
}

// failManage answers for the errors that edit, delete, restore and password
// reset share. op names the call in the log when something unexpected broke.
func failManage(c *gin.Context, op string, err error) {
	switch {
	case errors.Is(err, user.ErrNotFound):
		response.Fail(c, response.ErrNotFound)
	case errors.Is(err, user.ErrUserDeleted):
		response.Fail(c, response.ErrUserDeleted)
	case errors.Is(err, user.ErrLastAdmin):
		response.Fail(c, response.ErrLastAdmin)
	case errors.Is(err, user.ErrSelfChange):
		response.Fail(c, response.ErrCannotChangeSelf)
	case errors.Is(err, user.ErrEmailTaken):
		response.Fail(c, response.ErrEmailTaken)
	case errors.Is(err, user.ErrWeakPassword):
		response.Fail(c, response.ErrWeakPassword)
	case errors.Is(err, user.ErrInvalidEmail), errors.Is(err, user.ErrInvalidRole),
		errors.Is(err, user.ErrInvalidStatus), errors.Is(err, user.ErrInvalidComment):
		response.Fail(c, response.ErrInvalidParams)
	default:
		logger.Error(op+" failed", zap.Error(err))
		response.Fail(c, response.ErrInternal)
	}
}
