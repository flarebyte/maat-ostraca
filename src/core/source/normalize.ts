export const normalizeSource = (source: string): string => {
  return source.replace(/\r\n/g, '\n');
};
