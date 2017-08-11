from pypom import Page
from pages import locators
import time
from selenium.webdriver.support import expected_conditions as EC


class Base(Page):
    """Base class."""

    LOCATORS = locators.Base

    def __init__(self, selenium, base_url, **url_kwargs):
        """Override Page's init method to set a higher timeout."""
        super(Base, self).__init__(selenium, base_url, timeout=30,
                                   **url_kwargs)

    @property
    def get_tag(self):
        """Getter for tag."""
        tag_text = self.find_element(*self.LOCATORS.tag).text
        return tag_text

    @property
    def get_action_name(self):
        """Get recipe action name."""
        action_name = self.find_element(*self.LOCATORS.action_name)
        return action_name.text

    @property
    def heading(self):
        """H1 Heading."""
        return self.find_element(*self.LOCATORS.heading).text

    @property
    def heading_two(self):
        """H2 heading."""
        return self.find_element(*self.LOCATORS.heading_two).text

    @property
    def alert_message(self):
        """H1 Heading."""
        return self.find_element(*self.LOCATORS.alert_message).text

    def click_home_breadcrumb(self):
        """Click home ahref on breadcrumb."""
        time.sleep(5)
        from pages.home import Home
        self.find_element(*self.LOCATORS.home_breadcrumb).click()
        return Home(self.selenium, self.base_url).wait_for_page_to_load()

    def get_recipe_name(self):
        """Get the recipe name."""
        recipe_name_field = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.recipe_name_field))
        name = recipe_name_field.get_attribute('value')
        print("name", name)
        return name

    def get_selected_action(self):
        """Get current recipe action."""
        selected_action_name = self.find_element(
         *self.LOCATORS.selected_action_name)
        selected_recipe_action_text = selected_action_name.text
        print("selected recipe action ", selected_recipe_action_text)
        return selected_recipe_action_text
