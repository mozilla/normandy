import pytest
import requests
import json


@pytest.mark.skip(reason="need to figure out how to store session cookies")
@pytest.mark.nondestructive
def test_restapi(conf, selenium, qr_code):
    """Verifies that recipe created on UI is at restful api endpoint."""
    url = "https://normandy.dev.mozaws.net/api/v1/recipe/"
    r = requests.get(url)
    dictionary = requests.utils.dict_from_cookiejar(r.cookies)
    response = requests.get(url, cookies=dictionary)
    json_data = json.loads(response.text)
    print(json_data)
    # Test not complete. Please see issue 9.
