package sample

import (
	"fmt"
	"github.com/acme/lib"
	"net/http"
	"os"
)

func useImports() {
	fmt.Println(http.MethodGet, os.Args, lib.Name)
}
