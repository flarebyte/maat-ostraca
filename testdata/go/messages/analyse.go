package sample

import (
	"errors"
	"fmt"
	"log"
)

func demo(err error, value string) {
	errors.New("new fail")
	fmt.Errorf(`format fail`)
	log.Print("print fail")
	log.Printf("printf fail: %s", value)
	log.Println("println fail")
	panic("panic fail")

	errors.New(prefix + "ignored")
	fmt.Errorf(err.Error())
	log.Print(err)
	panic(err)
}
