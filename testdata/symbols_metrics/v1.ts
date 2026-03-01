import fs from 'node:fs';

export function processOrder(orderId: string): number {
  if (orderId.length > 0) {
    fs.readFileSync('orders.txt', 'utf8');
    return 1;
  }

  return 0;
}

class BillingService {
  Charge(total: number): number {
    if (total > 100) {
      fs.writeFileSync('audit.log', 'high');
    }

    return total;
  }
}

void BillingService;
