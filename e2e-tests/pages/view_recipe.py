from selenium.webdriver.support import expected_conditions as EC
from pages.base import Base
from pages import locators
from pages.edit_recipe import EditRecipe
import time


class ViewRecipe(Base):
    """View Recipe page."""

    LOCATORS = locators.ViewRecipe

    @property
    def get_action_name(self):
        """Get recipe action name."""
        action_name = self.find_element(*self.LOCATORS.action_name)
        return action_name.text

    def wait_for_page_to_load(self):
        """Wait for edit button."""
        self.wait.until(EC.visibility_of_element_located(
         self.LOCATORS.edit_button))
        return self

    def click_request_approval(self):
        """Click request approval and return view recipe page."""
        request_approval_button = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.request_approval_button))
        time.sleep(10)
        request_approval_button.click()
        time.sleep(5)
        return ViewRecipe(self.selenium, self.base_url).wait_for_page_to_load()

    def click_edit(self):
        """Click edit recipe."""
        self.find_element(*self.LOCATORS.edit_button).click()
        return EditRecipe(self.selenium, self.base_url).wait_for_page_to_load()

    def click_clone(self):
        """Click clone recipe."""
        from pages.clone_recipe import CloneRecipe
        self.find_element(*self.LOCATORS.clone_button).click()
        return CloneRecipe(self.selenium, self.base_url).wait_for_page_to_load() # noqa

    def click_approval_request(self):
        """Click approval request button."""
        from pages.approval_history import ApprovalHistory
        approval_request_button = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.approval_request_button))
        approval_request_button.click()
        return ApprovalHistory(self.selenium,
                               self.base_url).wait_for_page_to_load()

    def publish_recipe(self):
        """Publish a recipe."""
        publish_button = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.publish_button))
        publish_button.click()
        ok_button = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.ok_button))
        time.sleep(10)
        ok_button.click()
        time.sleep(5)
        return self

    def disable_recipe(self):
        """Disable a recipe."""
        self.find_element(*self.LOCATORS.disable_button).click()
        ok_button = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.ok_button))
        time.sleep(10)
        ok_button.click()
        time.sleep(5)
        return self
