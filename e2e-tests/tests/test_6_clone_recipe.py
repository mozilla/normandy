import pytest
from pages.ldap_login import LDAPLogin
import time


@pytest.mark.nondestructive
def test_clone_recipe(conf, base_url, selenium, qr_code):
    """Test cloning a recipe."""
    time.sleep(30)
    ldap_page = LDAPLogin(selenium, base_url)
    home_page = ldap_page.setup(conf, qr_code)
    recipes_listing_page = home_page.click_recipes()
    new_recipe_page = recipes_listing_page.click_new_recipe()
    view_recipe_page, recipe_action, recipe_name = new_recipe_page.create_new_recipe(conf) # noqa
    clone_recipe_page = view_recipe_page.click_clone()
    view_recipe_page = clone_recipe_page.clone_recipe(conf)
    assert view_recipe_page.alert_message == "You are viewing a draft."
    action_name = view_recipe_page.get_action_name
    assert recipe_action == action_name
