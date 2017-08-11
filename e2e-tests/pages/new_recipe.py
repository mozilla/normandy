from selenium.webdriver.support import expected_conditions as EC
from pages.base import Base
from pages import locators
import time


class NewRecipe(Base):
    """New recipe page."""

    LOCATORS = locators.NewRecipe

    def wait_for_page_to_load(self):
        """Wait for save button."""
        self.wait.until(EC.visibility_of_element_located(
         self.LOCATORS.save_button))
        return self

    def pick_random_action(self):
        """Return a random recipe action."""
        from random import choice
        # TODO: opt-out-study action currently not functioning
        # actions = ['console-log', 'show-heartbeat', 'preference-experiment','opt-out-study']  # noqa
        actions = ['console-log', 'show-heartbeat', 'preference-experiment']
        action = choice(actions)
        return action

    def create_new_recipe(self, conf):
        """Create a new recipe with a unique UUID."""
        """Return a view recipe page, recipe action, and recipe name."""
        import uuid
        from pages.view_recipe import ViewRecipe
        recipe_name = str(uuid.uuid1().hex)
        filter_expression = conf.get('recipe', 'filter_expression')
        recipe_action = self.pick_random_action()
        recipe_name_field = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.recipe_name_field))
        recipe_name_field.clear()
        recipe_name_field.send_keys(recipe_name)
        self.find_element(
         *self.LOCATORS.recipe_filter_expression).send_keys(
          filter_expression)
        self.configure_action(conf, recipe_action)
        save_button = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.save_button))
        save_button.click()
        view_recipe = ViewRecipe(self.selenium, self.base_url).wait_for_page_to_load() # noqa
        return view_recipe, recipe_action, recipe_name

    def select_random_branch_preference(self):
        """Select a random branch preference."""
        from random import choice
        preferences = [True, False]
        random_preference = choice(preferences)
        if random_preference:
            self.find_element(*self.LOCATORS.true_preference).click()
        else:
            self.find_element(*self.LOCATORS.false_preference).click()

    def configure_action(self, conf, recipe_action):
        """Configure action for recipe."""
        import uuid
        action_dropdown = self.wait.until(EC.element_to_be_clickable(
          self.LOCATORS.action_dropdown))
        action_dropdown.click()
        time.sleep(5)
        if recipe_action == 'console-log':
            console_log = self.wait.until(EC.element_to_be_clickable(
              self.LOCATORS.console_log))
            console_log.click()
            message = conf.get('console_log', 'message')
            self.find_element(*self.LOCATORS.action_message).clear()
            self.find_element(*self.LOCATORS.action_message).send_keys(message)
        elif recipe_action == 'show-heartbeat':
            heart_beat = self.wait.until(EC.element_to_be_clickable(
              self.LOCATORS.show_heartbeat))
            heart_beat.click()
            survey_id = conf.get('heart_beat', 'survey_id')
            message = conf.get('heart_beat', 'message')
            thanks_message = conf.get('heart_beat', 'thanks_message')
            post_url = conf.get('heart_beat', 'post_url')
            learn_more = conf.get('heart_beat', 'learn_more')
            learn_more_url = conf.get('heart_beat', 'learn_more_url')
            self.find_element(*self.LOCATORS.survey_id).clear()
            self.find_element(*self.LOCATORS.survey_id).send_keys(survey_id)
            self.find_element(*self.LOCATORS.action_message).clear()
            self.find_element(*self.LOCATORS.action_message).send_keys(message)
            self.find_element(*self.LOCATORS.thanks_message).clear()
            self.find_element(*self.LOCATORS.thanks_message).send_keys(
             thanks_message)
            self.find_element(*self.LOCATORS.post_answer_url).clear()
            self.find_element(*self.LOCATORS.post_answer_url).send_keys(
             post_url)
            self.find_element(*self.LOCATORS.learn_more).clear()
            self.find_element(*self.LOCATORS.learn_more).send_keys(learn_more)
            self.find_element(*self.LOCATORS.learn_more_url).clear()
            self.find_element(*self.LOCATORS.learn_more_url).send_keys(
             learn_more_url)
        elif recipe_action == 'preference-experiment':
            preference_experiment = self.wait.until(EC.element_to_be_clickable(
              self.LOCATORS.preference_experiment))
            preference_experiment.click()
            # experiment names must be uniquely global
            experiment_name = str(uuid.uuid1().hex)
            experiment_doc_url = conf.get('preference_experiment',
                                          'experiment_doc_url')
            preference_name = conf.get('preference_experiment',
                                       'preference_name')
            branch_name = conf.get('preference_experiment', 'branch_name')
            self.find_element(*self.LOCATORS.experiment_name).clear()
            self.find_element(*self.LOCATORS.experiment_name).send_keys(
             experiment_name)
            self.find_element(*self.LOCATORS.experiment_doc_url).clear()
            self.find_element(*self.LOCATORS.experiment_doc_url).send_keys(
             experiment_doc_url)
            self.find_element(*self.LOCATORS.preference_name).clear()
            self.find_element(*self.LOCATORS.preference_name).send_keys(
             preference_name)
            self.find_element(*self.LOCATORS.add_branch_button).click()
            self.find_element(*self.LOCATORS.branch_name).clear()
            self.find_element(*self.LOCATORS.branch_name).send_keys(
             branch_name)
            self.select_random_branch_preference()
        else:
            opt_out_study = self.wait.until(EC.element_to_be_clickable(
              self.LOCATORS.opt_out_study))
            opt_out_study.click()
