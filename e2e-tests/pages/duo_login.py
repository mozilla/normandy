from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from pages.base import Base
from pages.home import Home
from pages import locators


class DuoLogin(Base):
    """Duo authenication class."""

    LOCATORS = locators.DuoLogin

    def wait_for_page_to_load(self):
        """Wait for a0-not_logged_in class to show in DOM."""
        self.wait.until(EC.visibility_of_element_located(
          self.LOCATORS.a0_not_logged_in))
        return self

    def duo_login(self, qr_code):
        """Log into duo."""
        self.selenium.switch_to_frame(
         self.find_element(*self.LOCATORS.duo_iframe))
        dropdown_element = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.dropdown))
        select = Select(dropdown_element)
        select.select_by_value(self.LOCATORS.value)
        passcode_button = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.passcode_button))
        passcode_button.click()
        self.find_element(*self.LOCATORS.QR_input).send_keys(qr_code)
        self.find_element(*self.LOCATORS.login_button).click()
        self.selenium.switch_to_default_content()
        return Home(self.selenium, self.base_url).wait_for_page_to_load()
