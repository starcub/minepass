package handlers

type WhitelistUserRequest struct {
	Username string `json:"username"`
}

type WhitelistUsersResponse struct {
	Users []string `json:"users"`
}
