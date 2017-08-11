import pytest
from pages.ldap_login import LDAPLogin
import time


@pytest.mark.nondestructive
def test_disable_recipe(conf, base_url, selenium, qr_code):
    """Test disabling a recipe."""
    time.sleep(30)
    ldap_page = LDAPLogin(selenium, base_url)
    home_page = ldap_page.setup(conf, qr_code)
    recipes_listing_page = home_page.click_recipes()
    new_recipe_page = recipes_listing_page.click_new_recipe()
    view_recipe_page, recipe_action, recipe_name = new_recipe_page.create_new_recipe(conf) # noqa
    view_recipe_page = view_recipe_page.click_request_approval()
    approval_history_page = view_recipe_page.click_approval_request()
    approval_history_page = approval_history_page.approve_recipe(conf)
    view_recipe_page = approval_history_page.click_view_recipe_breadcrumb()
    view_recipe_page = view_recipe_page.publish_recipe()
    view_recipe_page = view_recipe_page.disable_recipe()
    assert view_recipe_page.alert_message == "You are viewing a draft."
