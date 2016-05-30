import {Action, registerAction} from '../utils';

export default class ConsoleLogAction extends Action {
    async execute() {
        this.normandy.log(this.recipe.arguments.message, 'info');
    }
}

registerAction('console-log', ConsoleLogAction);
