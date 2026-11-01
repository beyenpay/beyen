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
		Email:       req.Q,
		EmailExact:  req.QOp == "eq",
		Status:      model.UserStatus(req.Status),
		Roles:       roles,
		CreatedFrom: req.CreatedFrom,
		CreatedTo:   req.CreatedTo,
	})
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
	})
	switch {
	case err == nil:
	case errors.Is(err, user.ErrEmailTaken):
		response.Fail(c, response.ErrEmailTaken)
		return
	case errors.Is(err, user.ErrWeakPassword):
		response.Fail(c, response.ErrWeakPassword)
		return
	case errors.Is(err, user.ErrInvalidEmail), errors.Is(err, user.ErrInvalidRole):
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
