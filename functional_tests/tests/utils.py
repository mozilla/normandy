from selenium.webdriver.support.ui import Select, WebDriverWait


class Page(object):
    def __init__(self, driver):
        self.driver = driver

    def select(self, selector):
        """Shorthand for finding an element by a CSS selector."""
        return self.driver.find_element_by_css_selector(selector)

    def select_all(self, selector):
        """Shorthand for finding elements by a CSS selector."""
        return self.driver.find_elements_by_css_selector(selector)

    def wait_for_element(self, name, timeout=10):
        return wait_for(self.driver, lambda driver: getattr(self, name) is not None, timeout)


class Element(object):
    def __init__(self, selector):
        self.selector = selector

    def __get__(self, instance, owner):
        return instance.select(self.selector)


class FormField(Element):
    def __set__(self, instance, value):
        instance.select(self.selector).send_keys(value)


class SelectField(Element):
    def __get__(self, instance, owner):
        return Select(super().__get__(instance, owner))


class ElementGroup(object):
    def __init__(self, selector):
        self.selector = selector

    def __get__(self, instance, owner):
        return instance.select_all(self.selector)


def wait_for(driver, callback, timeout=10):
    return WebDriverWait(driver, timeout).until(lambda d: callback(d))
