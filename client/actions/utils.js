export class Action {
  constructor(normandy, recipe) {
    this.normandy = normandy;
    this.recipe = recipe;
  }
}

// Attempt to find the global registerAction, and fall back to a noop if it's
// not available.
export let registerAction = null;

try {
  registerAction = global.registerAction;
} catch (err) {
    // Not running in Node.
}

if (!registerAction) {
  try {
    registerAction = window.registerAction;
  } catch (err) {
        // Not running in a browser.
  }
}

// If it still isn't found, just shim it.
if (!registerAction) {
  registerAction = () => {};
}
