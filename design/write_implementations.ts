import { writeFile } from 'node:fs/promises';
import { writeSectionStickie } from './common.ts';
import { implementations } from './implementations.ts';

const IMPLEMENTATIONS_PATH = 'doc/IMPLEMENTATIONS.md';

export const generateImplementationsReport = async () => {
  const entries = Object.values(implementations).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const lines: string[] = [];
  lines.push('# Implementation Considerations (Generated)');
  lines.push('');
  lines.push('This document summarizes suggested implementation choices.');
  lines.push('');

  // Summary list
  lines.push('## Summary');
  for (const item of entries) {
    lines.push(`- ${item.title} [${item.name}]`);
  }
  lines.push('');

  // Detailed sections
  for (const item of entries) {
    lines.push(`## ${item.title} [${item.name}]`);
    lines.push('');
    lines.push(`- Description: ${item.description}`);
    if (item.calls && item.calls.length > 0) {
      lines.push(`- Calls: ${item.calls.join(', ')}`);
    }
    lines.push('');
  }

  await writeFile(IMPLEMENTATIONS_PATH, lines.join('\n'), 'utf8');

  // Also generate one stickie per implementation item.
  for (const item of entries) {
    const title = `Implementation: ${item.title}`;
    const noteParts = [`Description:\n- ${item.description}`];
    if (item.calls && item.calls.length > 0) {
      noteParts.push(`Calls:\n- ${item.calls.join('\n- ')}`);
    }
    await writeSectionStickie(title, noteParts.join('\n\n'), 'notes');
  }
};
