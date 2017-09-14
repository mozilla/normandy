from django.test import override_settings


def test_index(client):
    response = client.get('/')
    assert response.status_code == 302
    assert response.url == '/login/?next=/'


@override_settings(ADMIN_ENABLED=False)
def test_index_admin_disabled(client):
    response = client.get('/')
    assert response.status_code == 200
