import { calls } from './calls.ts';
import {
  appendToReport,
  appendUseCases,
  displayCallsDetailed,
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
  await displayCallsDetailed(calls);
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
};
