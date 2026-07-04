package handlers

import (
	"gabefraser/minepass/utils"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorcon/rcon"
)

func WhitelistAdd(c *gin.Context) {
	rcon := c.MustGet("rcon").(*rcon.Conn)

	var req WhitelistUserRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "No username was provided. Please try again.",
		})
		return
	}

	response, err := rcon.Execute("whitelist add " + req.Username)
	if err != nil {
		log.Fatal(err)
	}

	utils.Logger(c.ClientIP() + " added " + req.Username + " to the whitelist")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": response,
	})
}

func WhitelistRemove(c *gin.Context) {
	rcon := c.MustGet("rcon").(*rcon.Conn)

	var req WhitelistUserRequest
	if err := c.BindJSON(&req); err != nil {
		utils.Logger("No username was provided from " + c.ClientIP())

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "No username was provided. Please try again.",
		})
		return
	}

	response, err := rcon.Execute("whitelist remove " + req.Username)
	if err != nil {
		log.Fatal(err)
	}

	utils.Logger(c.ClientIP() + " removed " + req.Username + " from the whitelist")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": response,
	})
}

func WhitelistList(c *gin.Context) {
	rcon := c.MustGet("rcon").(*rcon.Conn)

	response, err := rcon.Execute("whitelist list")
	if err != nil {
		utils.Logger("Could not fetch whitelist for " + c.ClientIP())

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not fetch whitelist. Please try again.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": WhitelistUsersResponse{
			Users: parseWhitelistedUsers(response),
		},
	})
}

func parseWhitelistedUsers(response string) []string {
	parts := strings.SplitN(response, ":", 2)
	if len(parts) != 2 {
		return []string{}
	}

	usersRaw := strings.TrimSpace(parts[1])
	usersRaw = strings.TrimSuffix(usersRaw, ".")
	if usersRaw == "" {
		return []string{}
	}

	users := strings.Split(usersRaw, ",")
	parsedUsers := make([]string, 0, len(users))

	for _, user := range users {
		trimmedUser := strings.TrimSpace(user)
		if trimmedUser == "" {
			continue
		}

		parsedUsers = append(parsedUsers, trimmedUser)
	}

	return parsedUsers
}
