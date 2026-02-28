import { Command } from 'commander';

export const createCli = () => {
  const program = new Command();

  program
    .name('maat')
    .description('Minimal MAAT CLI hello world')
    .option('-n, --name <name>', 'Name to greet', 'world')
    .action((options: { name: string }) => {
      const message = `Hello, ${options.name}!`;
      // Single output line for predictable CLI behavior and testability.
      console.log(message);
    });

  return program;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await createCli().parseAsync(process.argv);
}
