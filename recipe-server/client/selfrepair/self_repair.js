import NormandyDriver from 'selfrepair/normandy_driver';
import {
  fetchRecipes,
  filterContext,
  doesRecipeMatch,
  runRecipe,
} from 'selfrepair/self_repair_runner';

const driver = new NormandyDriver();
driver.registerCallbacks();

// Actually fetch and run the recipes.
fetchRecipes().then(recipes => {
  filterContext(driver).then(context => {
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
