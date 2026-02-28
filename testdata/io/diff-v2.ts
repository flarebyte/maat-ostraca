import fs from 'node:fs';

export function syncData() {
  fs.readFileSync('in.txt', 'utf8');
  fetch('https://example.com/items');
  fs.writeFileSync('out.txt', 'next');
}

class Writer {
  Save() {
    fs.writeFileSync('out.txt', 'ok');
  }
}

void Writer;
