import pytest
from pages.ldap_login import LDAPLogin


@pytest.mark.skip(reason="extension feature wasn't implemented during testing")
@pytest.mark.nondestructive
def test_new_extension(conf, base_url, selenium, qr_code):
    """Test adding a new extension."""
    ldap_page = LDAPLogin(selenium, base_url)
    home_page = ldap_page.setup(conf, qr_code)
    extensions_listing_page = home_page.click_extensions()
    new_extension_page = extensions_listing_page.click_new_extension()
    new_extension_page.upload_extension()
    # Test not complete. See issue 11.
