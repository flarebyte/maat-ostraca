import * as fs from 'node:fs';
import defaultExport, { foo as renamedFoo } from 'pkg-a';
import type { TypeA } from './types';
import './side-effect';
import anotherDefault from 'pkg-a';
import { bar } from '../bar';

void defaultExport;
void renamedFoo;
void fs;
void bar;
void anotherDefault;
void (null as TypeA | null);
