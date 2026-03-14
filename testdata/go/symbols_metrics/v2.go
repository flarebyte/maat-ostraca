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

func (svc *Service) Sync(reader io.Reader, buf []byte) error {
	if len(buf) > 0 {
		io.ReadAll(reader)
	}
	fmt.Println("sync")
	return nil
}
