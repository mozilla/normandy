from utils import Element, ElementGroup, FormField, Page, SelectField, wait_for


class LoginPage(Page):
    username = FormField('#id_username')
    password = FormField('#id_password')


class RecipeListPage(Page):
    recipe_list = Element('.recipe-list')
    recipe_rows = ElementGroup('.recipe-list tbody tr')
    new_recipe_button = Element('.button[href*="/control/recipe/new"]')


class RecipeFormPage(Page):
    form = Element('.recipe-form')
    name = FormField('[name="name"]')
    enabled = FormField('[name="enabled"]')
    extra_filter_expression = FormField('[name="extra_filter_expression"]')
    action = SelectField('select[name="action"]')


def test_login_create_recipe(selenium):
    # Load control interface, expect login redirect.
    selenium.get('http://normandy:8000/control/')
    assert '/control/login' in selenium.current_url

    # Login
    login_page = LoginPage(selenium)
    login_page.username = 'admin'
    login_page.password = 'asdfqwer'
    login_page.password.submit()

    # Check for empty recipe listing
    recipe_list_page = RecipeListPage(selenium)
    wait_for(selenium, lambda driver: recipe_list_page.recipe_list is not None)
    assert len(recipe_list_page.recipe_rows) == 0

    # Load new recipe page
    recipe_list_page.new_recipe_button.click()
    recipe_form_page = RecipeFormPage(selenium)
    wait_for(selenium, lambda driver: recipe_form_page.form is not None)

    # Fill out form
    recipe_form_page.name = 'Test Recipe'
    recipe_form_page.enabled.click()
    recipe_form_page.extra_filter_expression = 'true'
    recipe_form_page.action.select_by_value('console-log')
    recipe_form_page.select('[name="arguments.message"]').send_keys('Test Message')
    recipe_form_page.form.submit()

    # Wait until we navigate away from the new recipe page
    wait_for(selenium, lambda driver: '/control/recipe/new' not in driver.current_url)

    # Check that the recipe list is updated
    selenium.get('http://normandy:8000/control/')
    assert len(recipe_list_page.recipe_rows) == 1
    columns = recipe_list_page.recipe_rows[0].find_elements_by_tag_name('td')
    assert columns[0].text == 'Test Recipe'
