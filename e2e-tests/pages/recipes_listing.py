from selenium.webdriver.support import expected_conditions as EC
from pages.base import Base
from pages import locators
from pages.new_recipe import NewRecipe


class RecipesListing(Base):
    """Recipe listing page."""

    LOCATORS = locators.RecipesListing

    def wait_for_page_to_load(self):
        """Wait for visibility of rows on Normandy's home page to load."""
        self.wait.until(EC.visibility_of_all_elements_located(
            self.LOCATORS.tr))
        return self

    def click_new_recipe(self):
        """Click new recipe button."""
        self.find_element(*self.LOCATORS.new_recipe_button).click()
        return NewRecipe(self.selenium, self.base_url).wait_for_page_to_load()
