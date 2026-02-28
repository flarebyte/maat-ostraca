declare const process: {
  argv: string[];
  exitCode?: number;
  stdout: { write: (message: string) => boolean };
  stderr: { write: (message: string) => boolean };
};
