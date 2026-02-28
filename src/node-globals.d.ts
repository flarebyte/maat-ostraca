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

declare module 'node:crypto' {
  interface Hash {
    update(data: string, inputEncoding?: 'utf8'): Hash;
    digest(encoding: 'hex'): string;
  }

  export const createHash: (algorithm: 'sha256') => Hash;
}
