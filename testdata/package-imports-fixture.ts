import { map } from 'lodash/fp';
import React from 'react';
import type { TypeA } from './types';
import '@scope/pkg';
import '../local';
import '/abs';
import 'file:./x';

export { foo } from '@scope/pkg/utils';
export { bar } from 'react';
export * from './rel-export';

void React;
void map;
void (null as TypeA | null);
