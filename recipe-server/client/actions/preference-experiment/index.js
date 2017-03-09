import { Action, registerAction } from '../utils';

export default class PreferenceExperimentAction extends Action {
  async execute() {
    this.normandy.log(this.recipe.arguments.slug, 'info');
  }
}

registerAction('preference-experiment', PreferenceExperimentAction);
