declare const process: {
  argv: string[];
  exitCode?: number;
  stdout: { write: (message: string) => boolean };
  stderr: { write: (message: string) => boolean };
  stdin: AsyncIterable<string | Uint8Array>;
};

declare class TextDecoder {
  decode(input?: Uint8Array, options?: { stream?: boolean }): string;
}

declare module 'node:fs/promises' {
  export const readFile: (path: string, encoding: 'utf8') => Promise<string>;
}
