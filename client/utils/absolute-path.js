/**
 * This folder contains source files for the action bundles that are
 * stored in the `/assets/` folder.
 *
 * It has been retained for archival purposes but should be considered
 * dead code.
 */

export default function absolutePath(base, relative) {
  const stack = base.split('/');
  const parts = relative.split('/');

  stack.pop();

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '.') {
      continue;
    }
    if (parts[i] === '..') {
      stack.pop();
    } else {
      stack.push(parts[i]);
    }
  }
  return stack.join('/');
}
