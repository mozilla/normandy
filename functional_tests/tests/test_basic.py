from utils import Element, ElementGroup, FormField, Page, SelectField, wait_for


class LoginPage(Page):
    form = Element('#login-form')
    username = FormField('#id_username')
    password = FormField('#id_password')

    def login(self, username=None, password=None):
        self.wait_for_element('form')
        self.username = username or 'user1'
        self.password = password or 'testpass'
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
    delete_button = Element('a.action-delete')
    request_approval_button = Element('.action-request')
    approve_button = Element('.action-approve')
    reject_button = Element('.action-reject')
    approve_comment = FormField('.approve-dropdown textarea')
    reject_comment = FormField('.reject-dropdown textarea')
    approve_confirm_button = Element('.approve-dropdown .mini-button')
    reject_confirm_button = Element('.reject-dropdown .mini-button')
    approved_status_indicator = Element('.status-indicator.approved')
    rejected_status_indicator = Element('.status-indicator.rejected')
    clone_button = Element('#page-header .button.clone')
    preview_button = Element('#page-header .button.preview')
    history_button = Element('#page-header .button.history')


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
    form_page.wait_for_element('delete_button')
    form_page.delete_button.click()

    recipe_delete_page = RecipeDeletePage(selenium)
    recipe_delete_page.wait_for_element('form')
    recipe_delete_page.wait_for_element('confirm_button')
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
    form_page.wait_for_element('delete_button')
    form_page.delete_button.click()

    recipe_delete_page = RecipeDeletePage(selenium)
    recipe_delete_page.wait_for_element('form')
    recipe_delete_page.wait_for_element('confirm_button')
    recipe_delete_page.confirm_button.click()

    recipe_list_page.wait_for_element('recipe_list')
    assert len(recipe_list_page.recipe_rows) == 0


def test_revision_page_clone_button(selenium):
    """Test the "clone" navigation button on a recipe revision page."""
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

    # Grab the 'base' URL with the recipe id
    recipe_url = selenium.current_url

    # Make an edit and save it to create a new revision
    form_page.survey_id = 'test-survey-revision'
    form_page.form.submit()

    # Wait for the page to change to the revision URL
    wait_for(selenium, lambda driver: recipe_url not in driver.current_url)

    # Click the clone button and ensure it went to the right place
    form_page.wait_for_element('clone_button')
    form_page.clone_button.click()

    clone_url = recipe_url + 'clone/'

    assert clone_url == selenium.current_url


class TestPeerApproval():
    def _setup(self, selenium):
        """Test creating a recipe, requesting approval and granting approval."""
        # Load control interface, expect login redirect.
        selenium.get('http://normandy:8000/control/')
        assert '/control/login' in selenium.current_url
        LoginPage(selenium).login()

        # Check for empty recipe listing
        self.recipe_list_page = RecipeListPage(selenium)
        self.recipe_list_page.wait_for_element('recipe_list')
        assert len(self.recipe_list_page.recipe_rows) == 0

        # Load new recipe page
        self.recipe_list_page.new_recipe_button.click()
        self.form_page = ConsoleLogFormPage(selenium)
        self.form_page.wait_for_element('form')

        # Fill out form
        self.form_page.name = 'Approve-This-Recipe'
        self.form_page.extra_filter_expression = 'true'
        self.form_page.action.select_by_value('console-log')
        self.form_page.wait_for_element('message')
        self.form_page.message = 'Test Message'
        self.form_page.form.submit()

        # Wait until we navigate away from the new recipe page
        wait_for(selenium, lambda driver: '/control/recipe/new/' not in driver.current_url)

        # Check that the recipe list is updated
        selenium.get('http://normandy:8000/control/')
        assert len(self.recipe_list_page.recipe_rows) == 1
        columns = self.recipe_list_page.recipe_rows[0].find_elements_by_tag_name('td')
        assert columns[0].text == 'Approve-This-Recipe'

        # Request approval for the recipe we created
        self.recipe_list_page.recipe_rows[0].click()
        self.form_page.wait_for_element('form')
        self.form_page.wait_for_element('request_approval_button')
        self.form_page.request_approval_button.click()

        # Check that the approval request was created
        self.form_page.wait_for_element('approve_button')
        assert self.form_page.approve_button

        # Logout and then login as another user
        selenium.get('http://normandy:8000/control/logout/')
        selenium.get('http://normandy:8000/control/')
        assert '/control/login' in selenium.current_url
        LoginPage(selenium).login(username='user2')

        # Go to the recipe details page
        self.recipe_list_page.wait_for_element('recipe_list')
        self.recipe_list_page.recipe_rows[0].click()

    def _teardown(self, selenium):
        # Delete the recipe we created
        selenium.get('http://normandy:8000/control/')
        self.recipe_list_page.recipe_rows[0].click()
        self.form_page.wait_for_element('delete_button')
        self.form_page.delete_button.click()

        recipe_delete_page = RecipeDeletePage(selenium)
        recipe_delete_page.wait_for_element('form')
        recipe_delete_page.wait_for_element('confirm_button')
        recipe_delete_page.confirm_button.click()

        self.recipe_list_page.wait_for_element('recipe_list')
        assert len(self.recipe_list_page.recipe_rows) == 0

    def test_approve(self, selenium):
        self._setup(selenium)

        # Approve the recipe
        self.form_page.wait_for_element('approve_button')
        self.form_page.approve_button.click()
        self.form_page.wait_for_element('approve_confirm_button')
        self.form_page.approve_comment = 'r+'
        self.form_page.approve_confirm_button.click()

        # Ensure the recipe was approved
        self.form_page.wait_for_element('approved_status_indicator')
        assert self.form_page.approved_status_indicator

        self._teardown(selenium)

    def test_reject(self, selenium):
        self._setup(selenium)

        # Reject the recipe
        self.form_page.wait_for_element('reject_button')
        self.form_page.reject_button.click()
        self.form_page.wait_for_element('reject_confirm_button')
        self.form_page.reject_comment = 'r-'
        self.form_page.reject_confirm_button.click()

        # Ensure the recipe was rejected
        self.form_page.wait_for_element('rejected_status_indicator')
        assert self.form_page.rejected_status_indicator

        self._teardown(selenium)
