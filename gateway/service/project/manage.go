package project

import (
	"context"
	"errors"
	"strings"

	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/repository"
	"github.com/beyenpay/x/logger"
)

const (
	defaultPageSize = 20
	maxPageSize     = 100
)

var ErrInvalidSort = errors.New("invalid sort field")

// ListInput is a page request plus optional filters; zero means "no condition".
type ListInput struct {
	Page, PageSize int
	Sort           string // a sortable field of the listing; empty means newest first
	SortDesc       bool
	Name           string // substring
	Comment        string // substring of the note
	Status         model.ProjectStatus
	CreatedFrom    int64
	CreatedTo      int64
}

// Listed is a project with the email of the admin who created it. The email is
// empty when nobody is credited, or when that user no longer exists.
type Listed struct {
	model.Project
	CreatorEmail string
}

type ListResult struct {
	Projects       []Listed
	Total          int64
	Page, PageSize int // after clamping, as actually applied
}

// List returns one page of projects, newest first unless told otherwise. It
// includes deleted ones; narrow with Status.
func (s *Service) List(ctx context.Context, in ListInput) (*ListResult, error) {
	if !repository.ValidProjectSort(in.Sort) {
		return nil, ErrInvalidSort
	}
	if in.Page < 1 {
		in.Page = 1
	}
	if in.PageSize < 1 {
		in.PageSize = defaultPageSize
	}
	in.PageSize = min(in.PageSize, maxPageSize)

	rows, total, err := s.projects.List(ctx,
		repository.ProjectSort{Key: in.Sort, Desc: in.SortDesc},
		repository.ProjectFilter{
			Name:        strings.TrimSpace(in.Name),
			Comment:     strings.TrimSpace(in.Comment),
			Status:      in.Status,
			CreatedFrom: in.CreatedFrom,
			CreatedTo:   in.CreatedTo,
		},
		(in.Page-1)*in.PageSize, in.PageSize)
	if err != nil {
		return nil, err
	}

	// One query for every creator on the page; there are only a few admins.
	var ids []int
	seen := map[int]bool{}
	for _, p := range rows {
		if p.CreatedBy > 0 && !seen[p.CreatedBy] {
			seen[p.CreatedBy] = true
			ids = append(ids, p.CreatedBy)
		}
	}
	emails, err := s.users.EmailsByIDs(ctx, ids)
	if err != nil {
		// The email is a convenience: show the page without it rather than fail.
		logger.Error("look up project creators failed", zap.Error(err))
		emails = nil
	}

	out := make([]Listed, len(rows))
	for i, p := range rows {
		out[i] = Listed{Project: p, CreatorEmail: emails[p.CreatedBy]}
	}
	return &ListResult{Projects: out, Total: total, Page: in.Page, PageSize: in.PageSize}, nil
}

// Delete marks a project deleted: its members lose access and nothing can be
// done in it any more, but the row stays. There is no way back from here.
// Deleting a deleted project succeeds, so a retry is harmless.
func (s *Service) Delete(ctx context.Context, id int) error {
	if err := s.projects.MarkDeleted(ctx, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrProjectNotFound
		}
		return err
	}

	// Also when it was already deleted, so a retry clears what a failed first
	// attempt left. The status is saved, and the caches expire by themselves, so
	// a failure here is logged, not returned.
	if err := s.authz.InvalidateProject(ctx, id); err != nil {
		logger.Error("invalidate project cache failed", zap.Int("project_id", id), zap.Error(err))
	}
	return nil
}
