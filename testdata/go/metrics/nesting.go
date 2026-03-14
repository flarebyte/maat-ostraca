package sample

func nesting(values []int) {
	if len(values) > 0 {
		for _, value := range values {
			if value > 1 {
				switch value {
				case 2:
					println(value)
				}
			}
		}
	}
}
