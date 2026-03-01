export const readStdinUtf8 = async (): Promise<string> => {
  const chunks: string[] = [];
  const decoder = new TextDecoder();

  for await (const chunk of process.stdin as AsyncIterable<
    string | Uint8Array
  >) {
    if (typeof chunk === 'string') {
      chunks.push(chunk);
    } else {
      chunks.push(decoder.decode(chunk, { stream: true }));
    }
  }

  chunks.push(decoder.decode());
  return chunks.join('');
};
