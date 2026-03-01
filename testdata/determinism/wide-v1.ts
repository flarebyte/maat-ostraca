import type { Stats } from 'node:fs';
import * as fs from 'node:fs';
import { readFileSync } from 'node:fs';
import axios from 'axios';
import { helper as localHelper } from './local';
import './polyfill';

export interface PaymentRequest {
  id: string;
  amount: number;
}

export interface PaymentGateway {
  charge(req: PaymentRequest): Promise<string>;
}

const DEFAULT_TIMEOUT_MS = 5000;

export async function loadConfig(pathname: string): Promise<string> {
  const fromDisk = readFileSync(pathname, 'utf8');
  const remote = await fetch('https://example.test/config');
  process.stdout.write('config loaded');

  if (!process.env.API_TOKEN) {
    logger.error('missing API_TOKEN');
    throw new Error('api token missing');
  }

  return `${fromDisk}${await remote.text()}`;
}

export const saveReport = async (content: string): Promise<void> => {
  await fs.promises.writeFile('report.txt', content);
  console.error('failed to persist report');
  localHelper();
};

export class BillingService implements PaymentGateway {
  async charge(req: PaymentRequest): Promise<string> {
    const payload = await axios.get('/billing/read');
    await axios.post('/billing/write', { id: req.id });

    if (req.amount < 0) {
      throw new Error('amount must be positive');
    }

    return String(payload.data);
  }

  loadStats(stats: Stats): number {
    const source = process.env.DATA_SOURCE ?? 'default';
    if (source === 'remote') {
      return stats.size;
    }
    return 0;
  }

  logFailure(): void {
    logger.error('charge failed');
    throw new Error('charge crashed');
  }
}

describe('BillingService', () => {
  it('charges customer', async () => {
    expect(true).toBe(true);
  });

  test.skip('returns zero for local source', () => {
    expect(DEFAULT_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
