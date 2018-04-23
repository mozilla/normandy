from django import template
from django.conf import settings
from django.urls import reverse
from django.utils.safestring import mark_safe


register = template.Library()


@register.simple_tag
def logout_button():
    if settings.USE_OIDC:
        logout_url = settings.OIDC_LOGOUT_URL
    else:
        logout_url = reverse('control:logout')

    return mark_safe(f'<a href="{logout_url}">Log Out <i class="fa fa-sign-out post"></i></a>')
