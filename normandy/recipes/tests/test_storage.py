import pytest

from normandy.recipes.models import Locale
from normandy.recipes.storage import ProductDetailsRelationalStorage


LANGUAGES_JSON = (
    '{"en-AU":{"English":"English (Australian)","native":"English (Australian)"},'
    '"en-CA":{"English":"English (Canadian)","native":"English (Canadian)"},'
    '"en-GB":{"English":"English (British)","native":"English (British)"},'
    '"en-NZ":{"English":"English (New Zealand)","native":"English (New Zealand)"},'
    '"en-US":{"English":"English (US)","native":"English (US)"},'
    '"en-ZA":{"English":"English (South African)","native":"English (South African)"},'
    '"eo":{"English":"Esperanto","native":"Esperanto"},'
    '"es":{"English":"Spanish","native":"Espa\u00f1ol"},'
    '"es-AR":{"English":"Spanish (Argentina)","native":"Espa\u00f1ol (de Argentina)"},'
    '"es-CL":{"English":"Spanish (Chile)","native":"Espa\u00f1ol (de Chile)"},'
    '"es-ES":{"English":"Spanish (Spain)","native":"Espa\u00f1ol (de Espa\u00f1a)"},'
    '"es-MX":{"English":"Spanish (Mexico)","native":"Espa\u00f1ol (de M\u00e9xico)"}}')


@pytest.mark.django_db
class TestProductDetailsRelationalStorage(object):
    def test_update_locales(self):
        assert Locale.objects.count() == 0

        storage = ProductDetailsRelationalStorage()
        storage.update('languages.json', LANGUAGES_JSON, '1999-01-01')

        assert Locale.objects.count() == 12
        assert Locale.objects.filter(code='en-US', name='English (US)').exists()
