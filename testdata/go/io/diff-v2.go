package sample

import (
	"fmt"
	"io"
	"os"
)

func SyncData() {
	os.ReadFile("config.json")
	io.ReadAll(reader)
	fmt.Println("ok")
}

type Client struct{}

func (c *Client) Status() {
	fmt.Println("ok")
}
