import type { Risk } from './common.ts';

// Central risk catalogue. Extend as the design evolves.
export const risks: Record<string, Risk> = {
  performance: {
    name: 'performance',
    title: 'Large repository and I/O scalability',
    description:
      'Walking large trees, reading many files, and running transforms in parallel can exhaust CPU, memory, or I/O bandwidth, causing slowdowns or timeouts.',
    mitigation:
      'Bounded worker pool, configurable timeouts/limits, deterministic ordering for aggregated output, and streaming (--lines) for better throughput.',
    calls: ['rules.resolve', 'analyse.rules', 'rules.dispatch'],
  },
};
