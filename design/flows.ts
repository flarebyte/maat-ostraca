import { calls } from './calls';
import type { ComponentCall, FlowContext } from './common';

export const cliArgsAnalyse = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'cli.analyse',
    title: 'Parse args for analysing the source code',
    directory: 'cmd/maat',
    note: 'flags: --in filename.go --rules io.calls.count,import.file.list --language go --json',
    level: context.level,
    useCases: [],
  };
  calls.push(call);
};
