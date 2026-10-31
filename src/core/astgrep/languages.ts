import python from '@ast-grep/lang-python';
import rust from '@ast-grep/lang-rust';
import swift from '@ast-grep/lang-swift';
import { registerDynamicLanguage } from '@ast-grep/napi';

let registered = false;
export const ensureDynamicLanguages = (): void => {
  if (!registered) {
    registerDynamicLanguage({ python, rust, swift });
    registered = true;
  }
};
