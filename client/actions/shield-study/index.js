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
    const storageIsDurable = await this.storage.isDurable();

    if (!storageIsDurable && !this.normandy.testing) {
      throw new Error('Storage durability unconfirmed');
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
