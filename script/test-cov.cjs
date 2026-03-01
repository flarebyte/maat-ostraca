#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const { globSync, mkdirSync, rmSync } = require('node:fs');
const { resolve } = require('node:path');
const { Report } = require('c8');
const defaultExclude = require('@istanbuljs/schema/default-exclude');
const defaultExtension = require('@istanbuljs/schema/default-extension');

const run = async () => {
  const reportsDir = resolve('coverage');
  const tempDir = resolve(reportsDir, 'tmp');

  rmSync(reportsDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });

  const testFiles = globSync('test/**/*.test.ts', { posix: true }).sort();

  const testRun = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--test', ...testFiles],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_V8_COVERAGE: tempDir,
      },
    },
  );

  const report = Report({
    include: [],
    exclude: defaultExclude,
    extension: defaultExtension,
    excludeAfterRemap: false,
    reporter: ['text-summary', 'lcov'],
    reporterOptions: {},
    reportsDirectory: reportsDir,
    tempDirectory: tempDir,
    watermarks: {},
    resolve: '',
    omitRelative: true,
    wrapperLength: undefined,
    all: false,
    src: undefined,
    allowExternal: false,
    skipFull: false,
    excludeNodeModules: true,
    mergeAsync: false,
    monocartArgv: null,
  });

  await report.run();
  process.exit(testRun.status === null ? 1 : testRun.status);
};

run().catch((error) => {
  const message =
    error instanceof Error ? error.message : 'coverage_error: unknown failure';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
