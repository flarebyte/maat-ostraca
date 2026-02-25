# Risks Overview (Generated)

This document summarizes key risks and mitigations.

## Summary
- Large repository and I/O scalability [performance]

## Large repository and I/O scalability [performance]

- Description: Walking large trees, reading many files, and running transforms in parallel can exhaust CPU, memory, or I/O bandwidth, causing slowdowns or timeouts.
- Mitigation: Bounded worker pool, configurable timeouts/limits, deterministic ordering for aggregated output, and streaming (--lines) for better throughput.
- Calls: rules.resolve, analyse.rules, rules.dispatch
