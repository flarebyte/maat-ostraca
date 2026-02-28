## Makefile: Thin, explicit wrappers for tools
## - One responsibility per target
## - No dynamic variables or shell logic
## - Real logic lives in scripts (TypeScript/Bun, bash)

.PHONY: lint format test test-race gen build build-dev e2e release clean help typecheck

BIOME := npx @biomejs/biome
BUN := bun

lint:
	$(BIOME) check

format:
	$(BIOME) format --write .
	$(BIOME) check --unsafe --write

test:
	npm run test

build:
	npm run build

typecheck:
	npm run typecheck

e2e:
	npm run test:e2e

release: build
	@printf "Artifacts in ./build (checksums.txt included)\n"

clean:
	npm run clean

complexity:
	scc --sort complexity --by-file -i ts . | head -n 15

sec:
	semgrep scan --config auto
dup:
	npx jscpd --format typescript --min-lines 15 --gitignore .

help:
	@printf "Targets:\n"
	@printf "  lint     Run linters (Biome + go vet).\n"
	@printf "  format   Apply formatting (gofmt + Biome).\n"
	@printf "  test     Run Go tests.\n"
	@printf "  test-race Run Go tests with race detector.\n"
	@printf "  gen      Generate artifacts (no-op placeholder).\n"
	@printf "  build    Build Go binaries via Bun script.\n"
	@printf "  build-dev Build dev binary into .e2e-bin/.\n"
	@printf "  e2e      Run Bun-powered end-to-end tests.\n"
	@printf "  release  Prepare release artifacts (depends on build).\n"
	@printf "  clean    Remove build artifacts.\n"
