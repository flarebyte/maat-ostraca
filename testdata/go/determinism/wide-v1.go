package sample

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"testing"

	"github.com/acme/lib"
)

type Reader interface {
	io.Closer
	Read(ctx context.Context) error
}

type Worker interface {
	Reader
	Process(req Request) (Response, error)
}

type Request struct{}
type Response struct{}
type Service struct{}

func Build(ctx context.Context, req Request) (Response, error) {
	if os.Getenv("APP_MODE") == "prod" {
		http.Get("https://example.com")
	}

	if _, ok := os.LookupEnv(`API_KEY`); ok {
		log.Println("api key present")
	}

	os.ReadFile("config.json")
	fmt.Printf("building %v", req)
	errors.New("build failed")
	fmt.Errorf("build wrapped")
	panic("panic literal")
	return Response{}, nil
}

func (svc *Service) Process(ctx context.Context, req Request) (Response, error) {
	for range []int{1, 2} {
		io.ReadAll(os.Stdin)
	}

	stream.Write([]byte("x"))
	log.Print("processing")
	return Response{}, nil
}

func (svc Service) Flush() error {
	os.WriteFile("out.txt", []byte("done"), 0o644)
	return nil
}

func TestService(t *testing.T) {
	t.Run("build/success", func(t *testing.T) {
	})
}

func BenchmarkService(b *testing.B) {
	b.Run(`process/fast`, func(b *testing.B) {
	})
}

var _ = lib.Version
