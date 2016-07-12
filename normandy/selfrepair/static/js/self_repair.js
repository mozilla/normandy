import NormandyDriver from './normandy_driver.js';
import { fetchRecipes, filterContext, doesRecipeMatch, runRecipe } from './self_repair_runner.js';

const driver = new NormandyDriver();
driver.registerCallbacks();

// Actually fetch and run the recipes.
fetchRecipes().then(recipes => {
  filterContext(driver).then(context => {
    // Update Normandy driver with user's country.
    driver._location.countryCode = context.normandy.country;

    for (const recipe of recipes) {
      doesRecipeMatch(recipe, context).then(([, match]) => {
        if (match) {
          runRecipe(recipe, driver).catch(err => {
            console.error(err);
          });
        }
      });
    }
  });
}).catch(err => {
  console.error(err);
});
