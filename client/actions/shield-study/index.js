import { Action, registerAction } from '../utils';

export default class ShieldStudyAction extends Action {
  constructor(normandy, recipe) {
    super(normandy, recipe);
    this.storage = normandy.createStorage(recipe.id);
  }

  setHasBeenShown() {
    this.storage.setItem('studyHasBeenShown', true);
  }

  getHasBeenShown() {
    return this.storage.getItem('studyHasBeenShown');
  }

  async execute() {
    const hasBeenShown = await this.getHasBeenShown();
    const shouldShowStudyPrompt = (
      this.normandy.testing
      || hasBeenShown === null
    );

    if (!shouldShowStudyPrompt) {
      return;
    }

    this.normandy.showStudyConsentPage(this.recipe.arguments);
    this.setHasBeenShown();
  }
}

registerAction('shield-study', ShieldStudyAction);
