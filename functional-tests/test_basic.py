from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities


def test():
    driver = webdriver.Remote(
        command_executor='http://selenium:4444/wd/hub',
        desired_capabilities=DesiredCapabilities.FIREFOX,
    )

    driver.get('http://normandy:8000/control/')
    assert 'SHIELD' in driver.title

    driver.close()
