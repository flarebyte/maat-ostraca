type ProcessEnvShape = Record<string, string | undefined>;
type RuntimeProcess = {
  env?: ProcessEnvShape;
};

export interface ColorSupportContext {
  isTTY: boolean;
  env?: ProcessEnvShape | undefined;
}

export interface HumanFormatStyle {
  colorEnabled: boolean;
}

const ANSI = {
  bold: ['\u001B[1m', '\u001B[22m'],
  cyan: ['\u001B[36m', '\u001B[39m'],
  green: ['\u001B[32m', '\u001B[39m'],
  red: ['\u001B[31m', '\u001B[39m'],
  yellow: ['\u001B[33m', '\u001B[39m'],
} as const;

const wrap = (
  value: string,
  enabled: boolean,
  [open, close]: readonly [string, string],
): string => {
  if (!enabled) {
    return value;
  }

  return `${open}${value}${close}`;
};

export const supportsHumanColor = ({
  isTTY,
  env = (globalThis as typeof globalThis & { process?: RuntimeProcess }).process
    ?.env ?? {},
}: ColorSupportContext): boolean => {
  if (!isTTY) {
    return false;
  }

  if (env.NO_COLOR !== undefined) {
    return false;
  }

  if (env.FORCE_COLOR === '0') {
    return false;
  }

  if (env.FORCE_COLOR !== undefined) {
    return true;
  }

  if (env.CI !== undefined) {
    return true;
  }

  if (env.TERM === 'dumb') {
    return false;
  }

  return env.TERM !== undefined || env.COLORTERM !== undefined;
};

export const createHumanFormatStyle = (
  colorEnabled = false,
): HumanFormatStyle => ({
  colorEnabled,
});

export const colorSection = (
  value: string,
  style: HumanFormatStyle,
): string => {
  return wrap(
    wrap(value, style.colorEnabled, ANSI.bold),
    style.colorEnabled,
    ANSI.cyan,
  );
};

export const colorRuleName = (
  value: string,
  style: HumanFormatStyle,
): string => {
  return wrap(value, style.colorEnabled, ANSI.bold);
};

export const colorDiffStatus = (
  value: string,
  style: HumanFormatStyle,
): string => {
  switch (value) {
    case 'added':
      return wrap(value, style.colorEnabled, ANSI.green);
    case 'removed':
      return wrap(value, style.colorEnabled, ANSI.red);
    case 'modified':
      return wrap(value, style.colorEnabled, ANSI.yellow);
    case 'unchanged':
      return wrap(value, style.colorEnabled, ANSI.cyan);
    default:
      return value;
  }
};

export const colorDelta = (value: string, style: HumanFormatStyle): string => {
  if (!style.colorEnabled) {
    return value;
  }

  if (value.startsWith('-')) {
    return wrap(value, true, ANSI.red);
  }

  if (value.startsWith('+')) {
    return wrap(value, true, ANSI.green);
  }

  return wrap(value, true, ANSI.yellow);
};
