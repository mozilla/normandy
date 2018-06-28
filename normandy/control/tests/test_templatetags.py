from django.urls import reverse

from normandy.control.templatetags.normandy_logout_button import logout_button


class TestLogoutButton(object):
    def test_without_oidc(self, settings):
        settings.USE_OIDC = False
        html = logout_button()
        assert reverse("control:logout") in html
        assert "None" not in html

    def test_with_oidc(self, settings):
        settings.USE_OIDC = True
        settings.OIDC_LOGOUT_URL = "https://example.com/auth/logout"
        html = logout_button()
        assert settings.OIDC_LOGOUT_URL in html
        assert reverse("control:logout") not in html
