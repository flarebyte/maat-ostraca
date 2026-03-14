package sample

import (
	"fmt"
	"io"
	"os"
)

type Service struct{}

func Load(flag bool) error {
	if flag {
		os.ReadFile("a")
		return nil
	}
	return nil
}

func Save(items []string) {
	for range items {
		fmt.Println("saved")
	}
}

func (svc *Service) Sync(reader io.Reader, buf []byte) error {
	if len(buf) > 0 {
		io.ReadAll(reader)
	}
	stream.Write(buf)
	return nil
}

func (svc Service) Flush() {
	os.WriteFile("out.txt", []byte("x"), 0o644)
}
