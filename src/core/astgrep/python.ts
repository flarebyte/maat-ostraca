import python from '@ast-grep/lang-python';
import { registerDynamicLanguage } from '@ast-grep/napi';

let registered = false;
export const ensurePython = (): void => {
  if (!registered) {
    registerDynamicLanguage({ python });
    registered = true;
  }
};
