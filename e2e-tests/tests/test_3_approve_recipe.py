import pytest
from pages.ldap_login import LDAPLogin
import time


@pytest.mark.nondestructive
def test_approve_recipe(conf, base_url, selenium, qr_code):
    """Test the approval flow of creating a recipe."""
    time.sleep(30)
    ldap_page = LDAPLogin(selenium, base_url)
    home_page = ldap_page.setup(conf, qr_code)
    recipes_listing_page = home_page.click_recipes()
    new_recipe_page = recipes_listing_page.click_new_recipe()
    view_recipe_page, recipe_action, recipe_name = new_recipe_page.create_new_recipe(conf) # noqa
    view_recipe_page = view_recipe_page.click_request_approval()
    time.sleep(10)
    assert view_recipe_page.alert_message == "This is pending approval."
    approval_history_page = view_recipe_page.click_approval_request()
    approval_history_page = approval_history_page.approve_recipe(conf)
    time.sleep(5)
    assert approval_history_page.get_tag == "Approved"
