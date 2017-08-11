from selenium.webdriver.support import expected_conditions as EC
from pages.base import Base
from pages import locators


class Home(Base):
    """Home page."""

    LOCATORS = locators.Home

    def wait_for_page_to_load(self):
        """Wait for visibility of rows on Normandy's home page to load."""
        self.wait.until(EC.visibility_of_element_located(self.LOCATORS.logo))
        return self

    def click_recipes(self):
        """Click recipes to go to recipes listing page."""
        from pages.recipes_listing import RecipesListing
        recipe = self.find_element(*self.LOCATORS.recipes)
        recipe.click()
        return RecipesListing(self.selenium,
                              self.base_url).wait_for_page_to_load()

    def click_extensions(self):
        """Click extensions to the extensions listing page."""
        from pages.extensions_listing import ExtensionsListing
        extensions = self.find_element(*self.LOCATORS.extensions)
        extensions.click()
        return ExtensionsListing(self.selenium,
                                 self.base_url).wait_for_page_to_load()
