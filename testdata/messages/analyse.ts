export function run(): void {
  throw new Error('fatal boom');
}

export function run2(flag: boolean): void {
  if (flag) {
    throw TypeError(`typed boom`);
  }

  throw 'plain boom';
}

console.error('console-fail');
logger.error('logger-fail');
ctx.logger.error(`ctx-fail`);

console.error(err);
logger.error(`${prefix}x`);
ctx.logger.error(`bad ${expr}`);

function throwBadTemplate(expr: string): never {
  throw new Error(`bad ${expr}`);
}

function throwBadConcat(prefix: string): never {
  throw new Error(`${prefix}x`);
}

void throwBadTemplate;
void throwBadConcat;
