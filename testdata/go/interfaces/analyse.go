package sample

import (
	"context"
	"io"
)

type Reader interface {
	Read(p []byte) (int, error)
}

type PaymentProvider interface {
	io.Closer
	Reader
	Charge(ctx context.Context, req ChargeRequest) (ChargeResponse, error)
	Close() error
}
