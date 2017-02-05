from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test(selenium):
    selenium.get('http://normandy:8000/control/')
    assert '/control/login' in selenium.current_url

    username = selenium.find_element_by_id('id_username')
    username.send_keys('admin')
    password = selenium.find_element_by_id('id_password')
    password.send_keys('asdfqwer')
    password.submit()

    recipe_list = WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'recipe-list'))
    )
    assert len(recipe_list.find_elements_by_css_selector('.recipe-list tbody tr')) == 0

    assert 'SHIELD' in selenium.title
