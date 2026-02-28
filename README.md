# maat-ostraca

`maat-ostraca` is a TypeScript CLI that analyzes source files and returns
structured, machine-friendly insights.

At a high level, the CLI is designed to:

- Parse code from a file path or stdin
- Run selected analysis rules on one source snapshot or a diff between two snapshots
- Return predictable JSON output focused on maps and stable ordering
- Help track code structure and evolution across time or across projects

The output model emphasizes direct key access (for example, function/method/class/interface maps),
compact metrics, and optional delta-focused diff views for low-noise reporting.
