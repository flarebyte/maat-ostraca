declare const process: {
  argv: string[];
};

declare const console: {
  log: (...args: unknown[]) => void;
};

interface ImportMeta {
  url: string;
}
