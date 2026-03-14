package sample

import (
	"fmt"
	"io"
	"os"
)

type Service struct{}

func Load(flag bool) error {
	os.ReadFile("a")
	return nil
}

func (svc *Service) Sync(reader io.Reader, buf []byte) error {
	fmt.Println("sync")
	return nil
}
