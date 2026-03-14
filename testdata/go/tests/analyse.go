package sample

import "testing"

func TestDemo(t *testing.T) {
	t.Run("case-a", func(t *testing.T) {})
	t.Run(`case-b`, func(t *testing.T) {})
	t.Run(name, func(t *testing.T) {})
}

func BenchmarkDemo(b *testing.B) {
	b.Run("bench-a", func(b *testing.B) {})
}

func TestPlain(t *testing.T) {}
