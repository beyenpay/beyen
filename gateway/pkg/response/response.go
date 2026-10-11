// Package response is the single place that writes API responses, so every
// endpoint has the same shape:
//
//	success: {"message":"success","data":...}
//	failure: {"code":"SOME_CODE","message":"fallback text"}
package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Body struct {
	Code    string `json:"code,omitempty"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

// Success writes 200 with data (nil is omitted).
func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Body{Message: "success", Data: data})
}

// Fail writes an error response. Use it in handlers.
func Fail(c *gin.Context, e Error) {
	c.JSON(e.Status, Body{Code: e.Code, Message: e.Message})
}

// Abort writes an error response and stops the handler chain. Use it in middleware.
func Abort(c *gin.Context, e Error) {
	c.AbortWithStatusJSON(e.Status, Body{Code: e.Code, Message: e.Message})
}
