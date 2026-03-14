package sample

import "fmt"

import (
	"fmt"
	"github.com/acme/lib"
	m "math"
	"net/http"
	_ "net/http/pprof"
	"os"
)

func useImports() float64 {
	fmt.Println(http.MethodGet, os.Args, lib.Name)
	return m.Pi
}
