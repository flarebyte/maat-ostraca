import fs from 'node:fs';

export function syncData() {
  fs.readFileSync('in.txt', 'utf8');
}

class Writer {
  Save() {
    fs.writeFileSync('out.txt', 'ok');
  }
}

void Writer;
