/**
 * This folder contains source files for the action bundles that are
 * stored in the `/assets/` folder.
 *
 * It has been retained for archival purposes but should be considered
 * dead code.
 */

import { Action, registerAction } from '../utils';

export default class ConsoleLogAction extends Action {
  async execute() {
    this.normandy.log(this.recipe.arguments.message, 'info');
  }
}

registerAction('console-log', ConsoleLogAction);
