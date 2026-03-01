const suffix = 'X';
const dynamicName = 'DYNAMIC';

const a = process.env.DB_HOST;
const b = process.env.API_KEY;
const c = process.env.API_KEY;
const d = process.env.CACHE_TTL;
const e = process.env?.PORT;
const f = process.env?.PORT;
const g = process?.env?.SERVICE_URL;

const excluded1 = process.env[dynamicName];
const excluded2 = process.env[`FOO_${suffix}`];
const excluded3 = process.env[`BAR${suffix}`];

void a;
void b;
void c;
void d;
void e;
void f;
void g;
void excluded1;
void excluded2;
void excluded3;
