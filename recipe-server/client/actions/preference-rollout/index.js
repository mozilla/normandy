import { Action, registerAction } from '../utils';

export default class PreferenceRollout extends Action {
  async execute() {
    this.normandy.preferenceRollout.register(this.recipe.arguments);
  }
}

registerAction('preference-rollout', PreferenceRollout);
