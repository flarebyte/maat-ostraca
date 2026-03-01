export type IoCallKind = 'read' | 'write';

const READ_CALLEES = new Set([
  'fetch',
  'axios.get',
  'fs.readFile',
  'fs.readFileSync',
  'fs.promises.readFile',
  'readFileSync',
]);

const WRITE_CALLEES = new Set([
  'axios.post',
  'axios.put',
  'axios.patch',
  'fs.writeFile',
  'fs.writeFileSync',
  'fs.promises.writeFile',
  'writeFileSync',
  'process.stdout.write',
  'process.stderr.write',
]);

const normalizeCallee = (callee: string): string => {
  return callee.replace(/\s+/g, '');
};

export const classifyIoCall = (callee: string): IoCallKind | null => {
  const normalized = normalizeCallee(callee);

  if (READ_CALLEES.has(normalized)) {
    return 'read';
  }
  if (WRITE_CALLEES.has(normalized)) {
    return 'write';
  }

  return null;
};
