import pytest
from pages.ldap_login import LDAPLogin
import time


@pytest.mark.nondestructive
def test_edit_recipe(conf, base_url, selenium, qr_code):
    """Test editing an existing recipe."""
    time.sleep(30)
    ldap_page = LDAPLogin(selenium, base_url)
    home_page = ldap_page.setup(conf, qr_code)
    recipes_listing_page = home_page.click_recipes()
    new_recipe_page = recipes_listing_page.click_new_recipe()
    view_recipe_page, recipe_action, recipe_name = new_recipe_page.create_new_recipe(conf) # noqa
    edit_recipe_page = view_recipe_page.click_edit()
    new_recipe_action, edit_recipe_page = edit_recipe_page.edit_recipe(conf)
    view_recipe_page = edit_recipe_page.click_view_recipe_breadcrumb()
    action_name = view_recipe_page.get_action_name
    assert new_recipe_action == action_name
