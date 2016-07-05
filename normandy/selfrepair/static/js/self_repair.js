import Normandy from './normandy_driver.js';
import { fetchRecipes, filterContext, doesRecipeMatch, runRecipe } from './self_repair_runner.js';

// Actually fetch and run the recipes.
fetchRecipes().then(recipes => {
  let context = filterContext().then(context => {
    // Update Normandy driver with user's country.
    Normandy._location.countryCode = context.normandy.country;

    for (let recipe of recipes) {
      doesRecipeMatch(recipe, context).then(([recipe, match]) => {
        if (match) {
          runRecipe(recipe).catch(err => {
            console.error(err);
          });
        }
      });
    }
  });
}).catch(err => {
  console.error(err);
});
