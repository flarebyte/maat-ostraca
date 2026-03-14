package sample

import "context"

type ChargeRequest struct{}
type RefundRequest struct{}
type ChargeResponse struct{}
type PaymentService struct{}

func Charge(ctx context.Context, req ChargeRequest) error {
	return nil
}

func Refund(req RefundRequest) (ChargeResponse, error) {
	return ChargeResponse{}, nil
}

func (s *PaymentService) Charge(ctx context.Context, req ChargeRequest) error {
	return nil
}

func (svc PaymentService) Refund(req RefundRequest) (ChargeResponse, error) {
	return ChargeResponse{}, nil
}
