from selenium.webdriver.support.ui import Select, WebDriverWait


class Page(object):
    """
    Base class for page-specific wrappers used during tests.

    To use, write a subclass for a single page in the application, and
    assign Element instances to its attributes for each element you
    wish to use in a test::

        class MyPage(Page):
            important_link = Element('a.important')

        def test_something(selenium):
            selenium.get('http://website.com')
            page = MyPage(selenium)
            page.important_link.click()
    """
    def __init__(self, driver):
        self.driver = driver

    def select(self, selector):
        """Shorthand for finding an element by a CSS selector."""
        return self.driver.find_element_by_css_selector(selector)

    def select_all(self, selector):
        """Shorthand for finding elements by a CSS selector."""
        return self.driver.find_elements_by_css_selector(selector)

    def wait_for_element(self, name, timeout=10):
        """
        Shorthand for waiting until an element defined on this class
        exists on the page.

        :param name:
            Attribute name of the Element instance to wait for.
        :param timeout:
            Seconds to wait before throwing an error. Defaults to 10 seconds.
        """
        return wait_for(self.driver, lambda driver: getattr(self, name) is not None, timeout)


class Element(object):
    """Descriptor for defining elements on a Page object."""
    def __init__(self, selector):
        self.selector = selector

    def __get__(self, instance, owner):
        return instance.select(self.selector)


class FormField(Element):
    """
    Element that, when assigned to, sends the value as keyboard input to
    the underlying element.
    """
    def __set__(self, instance, value):
        instance.select(self.selector).send_keys(value)


class SelectField(Element):
    """Returns a Select wrapper for the underlying element."""
    def __get__(self, instance, owner):
        return Select(super().__get__(instance, owner))


class ElementGroup(object):
    """Descriptor for defining groups of elements on a Page object."""
    def __init__(self, selector):
        self.selector = selector

    def __get__(self, instance, owner):
        return instance.select_all(self.selector)


def wait_for(driver, callback, timeout=10):
    """
    Waits until the given callback returns a truthy value. Throws an
    error if the timeout is reached before the callback passes.
    """
    return WebDriverWait(driver, timeout).until(lambda d: callback(d))
