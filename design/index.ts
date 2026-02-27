import { generateExamplesReport } from './write_examples.ts';
import { generateImplementationsReport } from './write_implementations.ts';
import { generateFlowDesignReport } from './write_report.ts';
import { generateRisksReport } from './write_risks.ts';

await generateFlowDesignReport();
await generateRisksReport();
await generateImplementationsReport();
await generateExamplesReport();
