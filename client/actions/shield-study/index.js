import { Action, registerAction } from '../utils';

export default class ShieldStudyAction extends Action {
  setHasBeenShown() {
    this.storage.setItem('studyHasBeenShown', true);
  }

  async getHasBeenShown() {
    const hasBeenShown = await this.storage.getItem('studyHasBeenShown');
    return hasBeenShown;
  }

  async execute() {
    try {
      this.storage = await this.normandy.createStorage(this.recipe.id);
    } catch (error) {
      throw new Error(error);
    }

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
