package sample

import (
	"fmt"
	"os"
)

func SyncData() {
	os.ReadFile("config.json")
}

type Client struct{}

func (c *Client) Status() {
	fmt.Println("ok")
}
