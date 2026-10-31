import python from '@ast-grep/lang-python';
import rust from '@ast-grep/lang-rust';
import { registerDynamicLanguage } from '@ast-grep/napi';

let registered = false;
export const ensureDynamicLanguages = (): void => {
  if (!registered) {
    registerDynamicLanguage({ python, rust });
    registered = true;
  }
};
