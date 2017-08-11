from selenium.webdriver.support import expected_conditions as EC
from pages.base import Base
from pages import locators
# import time
import uuid
from pages.view_recipe import ViewRecipe


class CloneRecipe(Base):
    """Clone Recipe page."""

    LOCATORS = locators.CloneRecipe

    def clone_recipe(self, conf):
        """Clone a recipe."""
        recipe_name = str(uuid.uuid1().hex)
        recipe_name_field = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.recipe_name_field))
        recipe_name_field.clear()
        recipe_name_field.send_keys(recipe_name)
        selected_action = self.find_element(*self.LOCATORS.selected_action)
        selected_action_text = selected_action.text
        if selected_action_text == 'preference-experiment':
            experiment_name = str(uuid.uuid1().hex)
            experiment_name_field = self.wait.until(EC.element_to_be_clickable(
              self.LOCATORS.experiment_name))
            experiment_name_field.clear()
            experiment_name_field.send_keys(experiment_name)
        save_button = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.save_button))
        save_button.click()
        return ViewRecipe(self.selenium, self.base_url).wait_for_page_to_load()
