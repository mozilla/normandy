import { Action, registerAction } from '../utils';

export default class PreferenceRollout extends Action {
  async execute() {
    // Stub - wait a second to 'execute'
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

registerAction('preference-rollout', PreferenceRollout);
