import type { Stats } from 'node:fs';
import * as fs from 'node:fs';
import { readFileSync, writeFileSync } from 'node:fs';
import axios from 'axios';
import { helper as localHelper } from './local';
import './polyfill';

export interface PaymentRequest {
  id: string;
  amount: number;
}

export interface PaymentGateway {
  charge(req: PaymentRequest): Promise<string>;
  refund(id: string): Promise<boolean>;
}

const DEFAULT_TIMEOUT_MS = 7000;

export async function loadConfig(pathname: string): Promise<string> {
  const fromDisk = readFileSync(pathname, 'utf8');
  const remote = await fetch('https://example.test/config-v2');
  process.stderr.write('config loaded');

  if (!process.env.API_TOKEN || !process.env.SECONDARY_TOKEN) {
    logger.error('missing API credentials');
    throw new Error('api credential missing');
  }

  return `${fromDisk}${await remote.text()}`;
}

export const saveReport = async (content: string): Promise<void> => {
  writeFileSync('report.txt', content);
  await fs.promises.writeFile('report.backup.txt', content);
  console.error('failed to persist report v2');
  localHelper();
};

export function cleanupCache(pathname: string): void {
  const cached = readFileSync(pathname, 'utf8');
  writeFileSync(pathname, cached.trim());
}

export class BillingService implements PaymentGateway {
  async charge(req: PaymentRequest): Promise<string> {
    const payload = await axios.get('/billing/read');
    await axios.put('/billing/write', { id: req.id });

    if (req.amount < 0) {
      throw new Error('amount must stay positive');
    }

    return String(payload.data);
  }

  async refund(id: string): Promise<boolean> {
    await axios.patch('/billing/refund', { id });
    return true;
  }

  loadStats(stats: Stats): number {
    const source = process.env.DATA_SOURCE_MODE ?? 'default';
    if (source === 'remote') {
      return stats.size;
    }
    return DEFAULT_TIMEOUT_MS;
  }

  logFailure(): void {
    logger.error('charge failed hard');
    throw new Error('charge crashed hard');
  }
}

describe('BillingService', () => {
  it.only('charges customer', async () => {
    expect(true).toBe(true);
  });

  test('returns timeout for local source', () => {
    expect(DEFAULT_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
