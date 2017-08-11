from selenium.webdriver.support import expected_conditions as EC
from pages.base import Base
from pages import locators
import time


class ApprovalHistory(Base):
    """Approval History page."""

    LOCATORS = locators.ApprovalHistory

    def wait_for_page_to_load(self):
        """Wait for visibility of approve button."""
        self.wait.until(EC.visibility_of_element_located(
         self.LOCATORS.approve))
        return self

    def click_approve(self):
        """Click approve button."""
        approve_button = self.find_element(*self.LOCATORS.approve)
        approve_button.click()
        return self

    def approve_recipe(self, conf):
        """Approve a recipe by sending in a comment and clicking approve."""
        comment = conf.get('approve', 'comment')
        self.find_element(*self.LOCATORS.comment).clear()
        self.find_element(*self.LOCATORS.comment).send_keys(comment)
        self.click_approve()
        return ApprovalHistory(self.selenium,
                               self.base_url).wait_for_page_to_load()

    def click_view_recipe_breadcrumb(self):
        """Click on the view recipe breadcrumb."""
        from pages.view_recipe import ViewRecipe
        time.sleep(5)
        self.find_element(*self.LOCATORS.view_recipe_breadcrumb).click()
        return ViewRecipe(self.selenium, self.base_url).wait_for_page_to_load()
