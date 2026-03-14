package sample

import (
	m "math"
	_ "net/http/pprof"
)

func useAlias() float64 {
	return m.Pi
}
