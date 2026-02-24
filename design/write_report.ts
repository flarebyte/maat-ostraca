import { calls } from './calls.ts';
import {
  appendKeyValueList,
  appendSection,
  appendToReport,
  appendUseCases,
  displayCallsAsText,
  getSetDifference,
  resetReport,
  toUseCaseSet,
} from './common.ts';
import { cliRoot } from './flows.ts';
import { mustUseCases, useCaseCatalogByName } from './use_cases.ts';


export const generateFlowDesignReport = async () => {
  // Build tree and header
  cliRoot({ level: 0 });
  await resetReport();
  await appendToReport('# FLOW DESIGN OVERVIEW (Generated)\n');
  await appendToReport('## Function calls tree\n');
  await appendToReport('```');
  await displayCallsAsText(calls);
  await appendToReport('```\n');

  // Use-case coverage
  await appendUseCases(
    'Supported use cases:',
    toUseCaseSet(calls),
    useCaseCatalogByName,
  );
  const unsupported = getSetDifference(mustUseCases, toUseCaseSet(calls));
  if (unsupported.size > 0) {
    await appendUseCases(
      'Unsupported use cases (yet):',
      unsupported,
      useCaseCatalogByName,
    );
  }

  await appendKeyValueList('Exit Codes', [
    ['0', 'success (no errors)'],
    ['1', 'fatal setup/validation error (no output)'],
    ['2', 'partial failures (some per-item errors present)'],
    ['3', 'script/reduce failure (pipeline aborted)'],
  ]);
  await appendSection('title', [
    'todo',
  ]);
}
