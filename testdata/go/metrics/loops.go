package sample

func loopKinds(items []int) {
	for {
		break
	}

	for len(items) > 0 {
		break
	}

	for index := 0; index < len(items); index++ {
		println(index)
	}

	for _, item := range items {
		println(item)
	}
}
