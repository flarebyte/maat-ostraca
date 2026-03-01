import { runCli } from './cmd/maat/cli.js';

const exitCode = await runCli(process.argv.slice(2));
process.exitCode = exitCode;
