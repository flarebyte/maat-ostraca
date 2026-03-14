package sample

func measure(values []int, in <-chan int, out chan<- int) int {
	total := 0

	for _, value := range values {
		if value > 0 {
			total += value
		}
	}

	switch total {
	case 0:
		total = 1
	default:
		total += 1
	}

	select {
	case next := <-in:
		out <- next
	default:
	}

	return total
}
