import { registerAsyncCallback } from '../utils';

export default function executeAction(driver, recipe) {
  driver.log(recipe.arguments.message, 'info');
}
registerAsyncCallback('action', executeAction);
