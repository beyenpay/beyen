package console

import (
	"errors"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	consoledto "github.com/beyenpay/beyen/gateway/dto/console"
	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/beyen/gateway/service/user"
	"github.com/beyenpay/x/logger"
)

type SetupHandler struct {
	svc *user.Service
}

func NewSetupHandler(svc *user.Service) *SetupHandler {
	return &SetupHandler{svc: svc}
}

// Status handles GET /api/console/setup/status.
func (h *SetupHandler) Status(c *gin.Context) {
	need, err := h.svc.NeedsSetup(c.Request.Context())
	if err != nil {
		logger.Error("setup status failed", zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}
	response.Success(c, consoledto.SetupStatusResponse{NeedsSetup: need})
}

// Setup handles POST /api/console/setup: it creates the first platform admin
// and only works while the system has no user at all.
func (h *SetupHandler) Setup(c *gin.Context) {
	var req consoledto.SetupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	u, err := h.svc.CreateFirstAdmin(c.Request.Context(), req.Email, req.Password)
	switch {
	case err == nil:
	case errors.Is(err, user.ErrSetupCompleted):
		response.Fail(c, response.ErrSetupCompleted)
		return
	case errors.Is(err, user.ErrInvalidEmail):
		response.Fail(c, response.ErrInvalidParams)
		return
	case errors.Is(err, user.ErrWeakPassword):
		response.Fail(c, response.ErrWeakPassword)
		return
	default:
		logger.Error("setup failed", zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}

	logger.Info("first admin created", zap.Int("user_id", u.ID))
	response.Success(c, consoledto.NewUserInfo(u))
}
