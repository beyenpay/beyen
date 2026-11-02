package console

import (
	"errors"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	consoledto "github.com/beyenpay/beyen/gateway/dto/console"
	"github.com/beyenpay/beyen/gateway/middleware"
	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/beyen/gateway/service/project"
	"github.com/beyenpay/x/logger"
)

type ProjectHandler struct {
	svc *project.Service
}

func NewProjectHandler(svc *project.Service) *ProjectHandler {
	return &ProjectHandler{svc: svc}
}

// List handles GET /api/console/system/projects.
func (h *ProjectHandler) List(c *gin.Context) {
	var req consoledto.ListProjectsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}
	if req.CreatedFrom > 0 && req.CreatedTo > 0 && req.CreatedFrom > req.CreatedTo {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	res, err := h.svc.List(c.Request.Context(), project.ListInput{
		Page:        req.Page,
		PageSize:    req.PageSize,
		Sort:        req.Sort,
		SortDesc:    req.Dir != "asc",
		Name:        req.Q,
		Comment:     req.Comment,
		Status:      model.ProjectStatus(req.Status),
		CreatedFrom: req.CreatedFrom,
		CreatedTo:   req.CreatedTo,
	})
	if errors.Is(err, project.ErrInvalidSort) {
		response.Fail(c, response.ErrInvalidParams)
		return
	}
	if err != nil {
		logger.Error("list projects failed", zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}

	items := make([]consoledto.ProjectListItem, len(res.Projects)) // never nil: the JSON must say [] not null
	for i, p := range res.Projects {
		items[i] = consoledto.NewProjectListItem(p)
	}
	response.Success(c, consoledto.Page[consoledto.ProjectListItem]{
		Items:    items,
		Total:    res.Total,
		Page:     res.Page,
		PageSize: res.PageSize,
	})
}

// Create handles POST /api/console/system/projects.
func (h *ProjectHandler) Create(c *gin.Context) {
	var req consoledto.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	by := middleware.PrincipalFrom(c).UserID // RequireLogin guarantees a principal
	p, err := h.svc.CreateBy(c.Request.Context(), req.Name, req.Comment, by)
	if errors.Is(err, project.ErrInvalidName) || errors.Is(err, project.ErrInvalidComment) {
		response.Fail(c, response.ErrInvalidParams)
		return
	}
	if err != nil {
		logger.Error("create project failed", zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}

	logger.Info("project created", zap.Int("project_id", p.ID), zap.Int("by", by))
	response.Success(c, consoledto.NewProjectListItem(project.Listed{Project: *p}))
}

// Delete handles DELETE /api/console/system/projects/:id. The project is
// marked deleted, not removed, and cannot be brought back from the console.
func (h *ProjectHandler) Delete(c *gin.Context) {
	var uri consoledto.ProjectIDURI
	if c.ShouldBindUri(&uri) != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	err := h.svc.Delete(c.Request.Context(), uri.ID)
	if errors.Is(err, project.ErrProjectNotFound) {
		response.Fail(c, response.ErrNotFound)
		return
	}
	if err != nil {
		logger.Error("delete project failed", zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}

	logger.Info("project deleted", zap.Int("project_id", uri.ID), zap.Int("by", middleware.PrincipalFrom(c).UserID))
	response.Success(c, nil)
}
