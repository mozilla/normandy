export class Action {
  constructor(normandy, recipe) {
    this.normandy = normandy;
    this.recipe = recipe;
  }
}

// Attempt to find the global registerAction, and fall back to a noop if it's
// not available.
export const registerAction = (
  (global && global.registerAction) ||
  (window && window.registerAction) ||
  function registerAction() {}
);

// Same as above, for registerAsyncCallback
export const registerAsyncCallback = (
  (global && global.registerAsyncCallback) ||
  (window && window.registerAsyncCallback) ||
  function registerAsyncCallback() {}
);
