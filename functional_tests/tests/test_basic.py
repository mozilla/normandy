from utils import Element, ElementGroup, FormField, Page, SelectField, wait_for


class LoginPage(Page):
    form = Element('#login-form')
    username = FormField('#id_username')
    password = FormField('#id_password')

    def login(self):
        self.wait_for_element('form')
        self.username = 'admin'
        self.password = 'asdfqwer'
        self.password.submit()


class RecipeListPage(Page):
    recipe_list = Element('.recipe-list')
    recipe_rows = ElementGroup('.recipe-list tbody tr')
    new_recipe_button = Element('.button[href*="/control/recipe/new"]')


class RecipeFormPage(Page):
    form = Element('.recipe-form')
    name = FormField('[name="name"]')
    extra_filter_expression = FormField('[name="extra_filter_expression"]')
    action = SelectField('select[name="action"]')
    delete_button = Element('a.delete')


class ConsoleLogFormPage(RecipeFormPage):
    message = FormField('[name="arguments.message"]')


class ShowHeartbeatFormPage(RecipeFormPage):
    survey_id = FormField('[name="arguments.surveyId"]')
    message = FormField('[name="arguments.message"]')
    thanks_message = FormField('[name="arguments.thanksMessage"]')


class RecipeDeletePage(Page):
    form = Element('.crud-form')
    confirm_button = Element('.delete[type="submit"]')


def test_create_recipe_console_log(selenium):
    """Test creating and deleting a console-log recipe."""
    # Load control interface, expect login redirect.
    selenium.get('http://normandy:8000/control/')
    assert '/control/login' in selenium.current_url
    LoginPage(selenium).login()

    # Check for empty recipe listing
    recipe_list_page = RecipeListPage(selenium)
    recipe_list_page.wait_for_element('recipe_list')
    assert len(recipe_list_page.recipe_rows) == 0

    # Load new recipe page
    recipe_list_page.new_recipe_button.click()
    form_page = ConsoleLogFormPage(selenium)
    form_page.wait_for_element('form')

    # Fill out form
    form_page.name = 'Console-Log-Test'
    form_page.extra_filter_expression = 'true'
    form_page.action.select_by_value('console-log')
    form_page.wait_for_element('message')
    form_page.message = 'Test Message'
    form_page.form.submit()

    # Wait until we navigate away from the new recipe page
    wait_for(selenium, lambda driver: '/control/recipe/new/' not in driver.current_url)

    # Check that the recipe list is updated
    selenium.get('http://normandy:8000/control/')
    assert len(recipe_list_page.recipe_rows) == 1
    columns = recipe_list_page.recipe_rows[0].find_elements_by_tag_name('td')
    assert columns[0].text == 'Console-Log-Test'

    # Delete the recipe we created
    recipe_list_page.recipe_rows[0].click()
    form_page.wait_for_element('form')
    form_page.delete_button.click()

    recipe_delete_page = RecipeDeletePage(selenium)
    recipe_delete_page.wait_for_element('form')
    recipe_delete_page.confirm_button.click()

    recipe_list_page.wait_for_element('recipe_list')
    assert len(recipe_list_page.recipe_rows) == 0


def test_create_disabled_recipe(selenium):
    """Test creating a recipe that is disabled."""
    # Load new recipe page
    selenium.get('http://normandy:8000/control/recipe/new/')
    LoginPage(selenium).login()  # Login, which will continue on
    form_page = ConsoleLogFormPage(selenium)
    form_page.wait_for_element('form')

    # Fill out form
    form_page.name = 'Console-Log-Test'
    form_page.extra_filter_expression = 'false'
    form_page.action.select_by_value('console-log')
    form_page.wait_for_element('message')
    form_page.message = 'Test Message'
    form_page.form.submit()

    # Wait until we navigate away from the new recipe page and delete
    wait_for(selenium, lambda driver: '/control/recipe/new' not in driver.current_url)
    selenium.get(selenium.current_url + 'delete/')

    recipe_delete_page = RecipeDeletePage(selenium)
    recipe_delete_page.wait_for_element('form')
    recipe_delete_page.confirm_button.click()


def test_create_recipe_show_heartbeat(selenium):
    """Test creating and deleting a show-heartbeat recipe."""
    # Load control interface, expect login redirect.
    selenium.get('http://normandy:8000/control/')
    assert '/control/login/' in selenium.current_url
    LoginPage(selenium).login()

    # Check for empty recipe listing
    recipe_list_page = RecipeListPage(selenium)
    recipe_list_page.wait_for_element('recipe_list')
    assert len(recipe_list_page.recipe_rows) == 0

    # Load new recipe page
    recipe_list_page.new_recipe_button.click()
    form_page = ShowHeartbeatFormPage(selenium)
    form_page.wait_for_element('form')

    # Fill out form
    form_page.name = 'Show-Heartbeat-Test'
    form_page.extra_filter_expression = 'true'
    form_page.action.select_by_value('show-heartbeat')
    form_page.wait_for_element('survey_id')
    form_page.survey_id = 'test-survey'
    form_page.message = 'Test Message'
    form_page.thanks_message = 'Thanks!'
    form_page.form.submit()

    # Wait until we navigate away from the new recipe page
    wait_for(selenium, lambda driver: '/control/recipe/new/' not in driver.current_url)

    # Check that the recipe list is updated
    selenium.get('http://normandy:8000/control/')
    assert len(recipe_list_page.recipe_rows) == 1
    columns = recipe_list_page.recipe_rows[0].find_elements_by_tag_name('td')
    assert columns[0].text == 'Show-Heartbeat-Test'

    # Delete the recipe we created
    recipe_list_page.recipe_rows[0].click()
    form_page.wait_for_element('form')
    form_page.delete_button.click()

    recipe_delete_page = RecipeDeletePage(selenium)
    recipe_delete_page.wait_for_element('form')
    recipe_delete_page.confirm_button.click()

    recipe_list_page.wait_for_element('recipe_list')
    assert len(recipe_list_page.recipe_rows) == 0
