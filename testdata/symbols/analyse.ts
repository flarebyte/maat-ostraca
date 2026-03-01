export async function alpha(_a: string, _b: number): Promise<void> {
  return;
}

export const beta = (x: Foo, _y): Bar => x as unknown as Bar;

const gamma = (z: Baz): Qux => z as unknown as Qux;

export default class PaymentService
  extends BaseService
  implements IChargeable, ILogger
{
  public async Charge(_amount: number): Promise<void> {
    return;
  }

  private static helper(_a: string): number {
    return 1;
  }

  computed() {}
}

export interface Chargeable extends B, A {
  log(message: string): void;
  charge(amount: number): Promise<void>;
}

interface Worker {
  run(): void;
}

const workerSample: Worker | null = null;

void gamma;
void PaymentService;
void workerSample;
