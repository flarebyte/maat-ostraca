## Makefile: Thin, explicit wrappers for tools
## - One responsibility per target
## - No dynamic variables or shell logic
## - Real logic lives in scripts (TypeScript/Bun, bash)

.PHONY: lint format test cov build typecheck e2e release clean complexity sec dup help

GH_FLAREBYTE := gh flarebyte

lint:
	$(GH_FLAREBYTE) lint

format:
	$(GH_FLAREBYTE) format

test:
	$(GH_FLAREBYTE) test

cov:
	$(GH_FLAREBYTE) cov

build:
	$(GH_FLAREBYTE) build
	npm run build

typecheck:
	npm run typecheck

e2e:
	npm run test:e2e

review: format test e2e lint

release: build
	@printf "Compiled npm package in ./dist\n"

clean:
	npm run clean

complexity:
	scc --sort complexity --by-file -i ts . | head -n 15

sec:
	semgrep scan --config auto
dup:
	npx jscpd --format typescript --min-lines 10 --gitignore .

help:
	@printf "Targets:\n"
	@printf "  lint       Run Biome checks.\n"
	@printf "  format     Format code with Biome via gh-flarebyte.\n"
	@printf "  test       Run unit tests (Node test runner via tsx).\n"
	@printf "  cov        Run unit coverage via gh-flarebyte.\n"
	@printf "  build      Verify with gh-flarebyte and compile TypeScript to dist/.\n"
	@printf "  typecheck  Run TypeScript type-check only.\n"
	@printf "  e2e        Run Bun-powered end-to-end tests.\n"
	@printf "  release    Prepare release artifacts (depends on build).\n"
	@printf "  clean      Remove dist/ artifacts.\n"
	@printf "  complexity Show top TypeScript files by complexity via scc.\n"
	@printf "  sec        Run Semgrep security scan.\n"
	@printf "  dup        Run duplicate code detection (jscpd).\n"
	@printf "  help       Show this help message.\n"
