from selenium.webdriver.support import expected_conditions as EC
from pages.base import Base
from pages.duo_login import DuoLogin
from pages import locators


class LDAPLogin(Base):
    """Login class for demo LDAP account."""

    URL_TEMPLATE = "/control-new/"
    LOCATORS = locators.LDAPLogin

    def wait_for_page_to_load(self):
        """Wait LDAP page's visibility of submit button."""
        self.wait.until(EC.visibility_of_element_located(self.LOCATORS.submit))
        return self

    def ldap_login(self, conf):
        """Login into LDAP."""
        """Return Duo class after logging in with demo LDAP account."""
        username = conf.get('login', 'username')
        password = conf.get('login', 'password')
        self.open()
        self.find_element(*self.LOCATORS.username).send_keys(username)
        self.find_element(*self.LOCATORS.password).send_keys(password)
        self.find_element(*self.LOCATORS.submit).click()
        return DuoLogin(self.selenium, self.base_url).wait_for_page_to_load()

    def setup(self, conf, qr_code):
        """Return home page after loginning into ldap and duo."""
        duo_page = self.ldap_login(conf)
        home_page = duo_page.duo_login(qr_code)
        return home_page
