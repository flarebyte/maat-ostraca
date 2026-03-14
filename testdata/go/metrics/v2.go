package sample

func measure(values []int, in <-chan int, out chan<- int) int {
	total := 0

	for _, value := range values {
		if value > 0 {
			total += value
		} else if value < 0 {
			total -= value
		}
	}

	for index := 0; index < len(values); index++ {
		total += index
	}

	switch total {
	case 0:
		total = 1
	case 1:
		total = 2
	default:
		total += 1
	}

	select {
	case next := <-in:
		out <- next
	case out <- total:
	default:
	}

	return total
}
