import pytest
from django.core.urlresolvers import reverse


@pytest.mark.django_db()
def test_classify_doesnt_error(client):
    res = client.get(reverse('normandy.classifier'))
    assert res.status_code == 302
