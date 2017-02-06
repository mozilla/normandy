from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_login_create_recipe(selenium):
    # Load control interface, expect login redirect.
    selenium.get('http://normandy:8000/control/')
    assert '/control/login' in selenium.current_url

    # Login
    username = selenium.find_element_by_id('id_username')
    username.send_keys('admin')
    password = selenium.find_element_by_id('id_password')
    password.send_keys('asdfqwer')
    password.submit()

    # Wait for empty recipe listing
    recipe_list = WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'recipe-list'))
    )
    assert len(recipe_list.find_elements_by_css_selector('.recipe-list tbody tr')) == 0

    # Click new recipe button
    selenium.find_element_by_css_selector('.button[href*="/control/recipe/new"]').click()
    recipe_form = WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'recipe-form'))
    )

    # Fill out form
    recipe_form.find_element_by_name('name').send_keys('Test Recipe')
    recipe_form.find_element_by_name('enabled').click()
    recipe_form.find_element_by_name('extra_filter_expression').send_keys('true')
    recipe_form.find_element_by_css_selector(
        'select[name="action"] > option[value="console-log"]'
    ).click()
    recipe_form.find_element_by_name('arguments.message').send_keys('Test Message')
    recipe_form.submit()

    # Wait until we navigate away from the new recipe page
    WebDriverWait(selenium, 10).until(
        lambda selenium: '/control/recipe/new' not in selenium.current_url
    )

    # Check that the recipe list is updated
    selenium.get('http://normandy:8000/control/')
    recipe_list = selenium.find_element_by_class_name('recipe-list')
    rows = recipe_list.find_elements_by_css_selector('.recipe-list tbody tr')
    assert len(rows) == 1
    columns = rows[0].find_elements_by_tag_name('td')
    assert columns[0].text == 'Test Recipe'
