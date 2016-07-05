function ConsoleLogAction(normandy, recipe) {
  this.normandy = normandy;
  this.recipe = recipe;
}

ConsoleLogAction.prototype.execute = function () {
  var normandy = this.normandy;
  var recipe = this.recipe;

  return new Promise(function (resolve) {
    normandy.log(recipe.arguments.message, 'info');
  });
};

window.registerAction('console-log', ConsoleLogAction);
