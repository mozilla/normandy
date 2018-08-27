/* global window */
class ConsoleLogAction {
  constructor(normandy, recipe) {
    this.normandy = normandy;
    this.recipe = recipe;
  }

  execute() {
    const { normandy, recipe } = this;

    return new Promise(() => {
      normandy.log(recipe.arguments.message, 'info');
    });
  }
}

window.registerAction('console-log', ConsoleLogAction);
