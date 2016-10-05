import { Action, registerAction } from '../utils';

export default class ShieldStudyAction extends Action {
  constructor(normandy, recipe) {
    super(normandy, recipe);
    this.storage = normandy.createStorage(recipe.id);
  }

  async execute() {
    this.normandy.showStudyConsentPage(this.recipe.arguments);
  }
}

registerAction('shield-study', ShieldStudyAction);
