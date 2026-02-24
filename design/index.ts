import { generateFlowDesignReport } from './write_report.ts';
import { generateRisksReport } from './write_risks.ts';

await generateFlowDesignReport();
await generateRisksReport();
