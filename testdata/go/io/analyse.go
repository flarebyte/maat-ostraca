package sample

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

func LoadConfig() {
	os.ReadFile("config.json")
	http.Get("https://example.com")
}

func SaveConfig() {
	os.WriteFile("config.json", nil, 0o644)
	fmt.Println("saved")
	log.Printf("saved")
}

type Client struct{}

func (c *Client) Fetch() {
	io.ReadAll(c.reader())
	http.Post("https://example.com", "text/plain", nil)
}

func (c Client) Flush() {
	c.writer().Write([]byte("ok"))
}
