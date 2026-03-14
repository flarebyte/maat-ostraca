package sample

func conditions(flag bool, x int, in <-chan int, out chan<- int) {
	if flag {
		println("a")
	} else if x > 0 {
		println("b")
	}

	switch x {
	case 1:
		println("one")
	case 2:
		println("two")
	default:
		println("other")
	}

	select {
	case value := <-in:
		out <- value
	case out <- x:
	default:
	}
}
