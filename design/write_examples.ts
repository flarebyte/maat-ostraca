import { writeFile } from 'node:fs/promises';
import {
  exampleCliJsonResultText,
  exampleRulesListResultText,
} from './examples.ts';

const EXAMPLES_PATH = 'doc/EXAMPLES.md';

export const generateExamplesReport = async () => {
  const lines: string[] = [];
  lines.push('# Examples (Generated)');
  lines.push('');
  lines.push('## Analyze Command Output');
  lines.push('');
  lines.push('```json');
  lines.push(exampleCliJsonResultText);
  lines.push('```');
  lines.push('');
  lines.push('## Rules List Command Output');
  lines.push('');
  lines.push('```json');
  lines.push(exampleRulesListResultText);
  lines.push('```');
  lines.push('');

  await writeFile(EXAMPLES_PATH, lines.join('\n'), 'utf8');
};
