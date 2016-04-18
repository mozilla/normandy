from django import forms
from django.contrib.admin import widgets
from django.utils import timezone

from normandy.recipes.models import Client, Country, Locale, ReleaseChannel


class ClientForm(forms.Form):
    """Form to specify client configurations for testing purposes."""
    def __init__(self, *args, request=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.request = request

    locale = forms.ModelChoiceField(Locale.objects.all(), empty_label=None, to_field_name='code')
    release_channel = forms.ModelChoiceField(
        ReleaseChannel.objects.all(),
        initial='release',
        empty_label=None,
        to_field_name='slug'
    )
    country = forms.ModelChoiceField(
        Country.objects.all(),
        empty_label=None,
        to_field_name='code'
    )
    request_time = forms.SplitDateTimeField(required=False, widget=widgets.AdminSplitDateTime)

    def save(self):
        return Client(
            request=self.request,
            locale=self.cleaned_data['locale'].code,
            country=self.cleaned_data['country'].code,
            request_time=self.cleaned_data.get('request_time', timezone.now()),
            release_channel=self.cleaned_data['release_channel'].slug,
            user_id=''
        )
