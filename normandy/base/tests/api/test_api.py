import json

import pytest
from rest_framework.test import APIClient

from django.conf.urls import url
from django.contrib.auth.models import Group, Permission, User
from django.contrib.contenttypes.models import ContentType
from django.views.generic import View

from normandy.base.api.permissions import AdminEnabled
from normandy.base.api.views import APIRootView
from normandy.base.api.routers import MixedViewRouter
from normandy.base.tests import GroupFactory, UserFactory, Whatever


@pytest.mark.django_db
class TestApiRootV1(object):
    def test_it_works(self, api_client):
        res = api_client.get("/api/v1/")
        assert res.status_code == 200
        assert res.json() == {
            "recipe-list": "http://testserver/api/v1/recipe/",
            "recipe-signed": "http://testserver/api/v1/recipe/signed/",
            "action-list": "http://testserver/api/v1/action/",
            "action-signed": "http://testserver/api/v1/action/signed/",
            "reciperevision-list": "http://testserver/api/v1/recipe_revision/",
            "classify-client": "http://testserver/api/v1/classify_client/",
            "approvalrequest-list": "http://testserver/api/v1/approval_request/",
            "extension-list": "http://testserver/api/v1/extension/",
        }

    def test_it_redirects_classify_client_to_app_server(self, api_client, settings):
        settings.APP_SERVER_URL = "https://testserver-app/"

        res = api_client.get("/api/v1/")
        assert res.status_code == 200
        assert res.json()["classify-client"] == "https://testserver-app/api/v1/classify_client/"

    def test_includes_cache_headers(self, api_client):
        res = api_client.get("/api/v1/")
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert "max-age=" in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_cors_headers(self, api_client):
        res = api_client.get("/api/v1/")
        assert res.status_code == 200
        assert not res.has_header("access-control-allow-origin")

        res = api_client.get("/api/v1/", HTTP_ORIGIN="any.example.com")
        assert res.status_code == 200
        assert res.has_header("access-control-allow-origin")
        assert res["access-control-allow-origin"] == "*"

        # OPTIONS method is louder
        res = api_client.options("/api/v1/", HTTP_ORIGIN="any.example.com")
        assert res.status_code == 200
        assert res["access-control-allow-origin"] == "*"
        assert res.has_header("access-control-allow-headers")
        assert res.has_header("access-control-allow-origin")
        assert res.has_header("access-control-allow-methods")


@pytest.mark.django_db
class TestApiRootV2(object):
    def test_it_works(self, api_client):
        res = api_client.get("/api/v2/")
        assert res.status_code == 200

        assert res.json() == {
            "action-list": "http://testserver/api/v2/action/",
            "recipe-list": "http://testserver/api/v2/recipe/",
            "reciperevision-list": "http://testserver/api/v2/recipe_revision/",
            "approvalrequest-list": "http://testserver/api/v2/approval_request/",
        }

    def test_includes_cache_headers(self, api_client):
        res = api_client.get("/api/v2/")
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert "max-age=" in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_cors_headers(self, api_client):
        res = api_client.get("/api/v2/")
        assert res.status_code == 200
        assert not res.has_header("access-control-allow-origin")

        res = api_client.get("/api/v2/", HTTP_ORIGIN="any.example.com")
        assert res.status_code == 200
        assert res.has_header("access-control-allow-origin")
        assert res["access-control-allow-origin"] == "*"

        # OPTIONS method is louder
        res = api_client.options("/api/v2/", HTTP_ORIGIN="any.example.com")
        assert res.status_code == 200
        assert res["access-control-allow-origin"] == "*"
        assert res.has_header("access-control-allow-headers")
        assert res.has_header("access-control-allow-origin")
        assert res.has_header("access-control-allow-methods")


class TestAPIRootView(object):
    @pytest.fixture
    def static_url_pattern(cls):
        return url("^test$", View.as_view(), name="test-view")

    @pytest.fixture
    def dynamic_url_pattern(cls):
        url_pattern = url("^test$", View.as_view(), name="test-view")
        url_pattern.allow_cdn = False
        return url_pattern

    def test_it_works(self, rf, mocker, static_url_pattern):
        mock_reverse = mocker.patch("normandy.base.api.views.reverse")
        mock_reverse.return_value = "/test"
        view = APIRootView.as_view(api_urls=[static_url_pattern])

        res = view(rf.get("/test"))
        assert mock_reverse.called
        assert res.status_code == 200
        res.render()
        assert json.loads(res.content.decode()) == {"test-view": "http://testserver/test"}

    def test_it_reroutes_dynamic_views(self, rf, mocker, settings, dynamic_url_pattern):
        mock_reverse = mocker.patch("normandy.base.api.views.reverse")
        mock_reverse.return_value = "/test"
        settings.APP_SERVER_URL = "https://testserver-app/"
        view = APIRootView.as_view(api_urls=[dynamic_url_pattern])

        res = view(rf.get("/test"))
        assert mock_reverse.called
        assert res.status_code == 200
        res.render()
        assert json.loads(res.content.decode()) == {"test-view": "https://testserver-app/test"}

    def test_dynamic_views_and_no_setting(self, rf, mocker, settings, dynamic_url_pattern):
        mock_reverse = mocker.patch("normandy.base.api.views.reverse")
        mock_reverse.return_value = "/test"
        settings.APP_SERVER_URL = None
        view = APIRootView.as_view(api_urls=[dynamic_url_pattern])

        res = view(rf.get("/test"))
        assert mock_reverse.called
        assert res.status_code == 200
        res.render()
        assert json.loads(res.content.decode()) == {"test-view": "http://testserver/test"}


class TestMixedViewRouter(object):
    def test_register_view_takes_allow_cdn(self):
        router = MixedViewRouter()
        router.register_view("view-1", View, name="view-1", allow_cdn=True)
        router.register_view("view-2", View, name="view-2", allow_cdn=False)
        assert [v.name for v in router.registered_view_urls] == ["view-1", "view-2"]
        assert router.registered_view_urls[0].allow_cdn
        assert not router.registered_view_urls[1].allow_cdn

    def test_register_view_requires_name(self):
        router = MixedViewRouter()
        with pytest.raises(TypeError) as err:
            router.register_view("view", View, allow_cdn=True)
        assert "missing 1 required keyword-only argument: 'name'" in str(err)

    def test_get_urls_includes_api_root(self):
        router = MixedViewRouter()
        urls = router.get_urls()
        assert len(urls) == 1
        assert urls[0].name == router.root_view_name

    def test_get_urls_includes_non_viewset_views(self):
        router = MixedViewRouter()
        router.register_view("view", View, name="standalone-view")
        urls = router.get_urls()
        assert len(urls) == 2
        assert urls[0].name == "standalone-view"

    def test_it_doesnt_pass_the_api_root_url_to_the_api_root_view(self, mocker):
        mock_api_view = mocker.Mock()
        router = MixedViewRouter(view=mock_api_view)
        router.register_view("view", View, name="standalone-view")
        router.get_urls()
        assert mock_api_view.called_once_with([Whatever(lambda v: v.name == "standalone-view")])


@pytest.mark.django_db
class TestCurrentUserView(object):
    def test_it_works(self, api_client):
        user = User.objects.first()  # Get the default user
        res = api_client.get("/api/v1/user/me/")
        assert res.status_code == 200
        assert res.data == {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
        }

    def test_unauthorized(self, api_client):
        res = api_client.logout()
        res = api_client.get("/api/v1/user/me/")
        assert res.status_code == 401


@pytest.mark.django_db
class TestServiceInfoV2View(object):
    def test_it_works(self, api_client, settings):
        user = User.objects.first()  # Get the default user
        settings.PEER_APPROVAL_ENFORCED = False

        res = api_client.get("/api/v2/service_info/")
        assert res.status_code == 200
        assert res.data == {
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
            },
            "peer_approval_enforced": settings.PEER_APPROVAL_ENFORCED,
            "github_url": settings.GITHUB_URL,
        }

    def test_logged_out(self, settings):
        client = APIClient()
        settings.PEER_APPROVAL_ENFORCED = False

        res = client.get("/api/v2/service_info/")
        assert res.status_code == 200
        assert res.data == {
            "user": None,
            "peer_approval_enforced": settings.PEER_APPROVAL_ENFORCED,
            "github_url": settings.GITHUB_URL,
        }


@pytest.mark.django_db
class TestServiceInfoView(object):
    def test_it_works(self, api_client, settings):
        user = User.objects.first()  # Get the default user
        settings.PEER_APPROVAL_ENFORCED = False

        res = api_client.get("/api/v3/service_info/")
        assert res.status_code == 200
        assert res.data == {
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
            },
            "peer_approval_enforced": settings.PEER_APPROVAL_ENFORCED,
            "github_url": settings.GITHUB_URL,
        }

    def test_logged_out(self, settings):
        client = APIClient()
        settings.PEER_APPROVAL_ENFORCED = False

        res = client.get("/api/v3/service_info/")
        assert res.status_code == 200
        assert res.data == {
            "user": None,
            "peer_approval_enforced": settings.PEER_APPROVAL_ENFORCED,
            "github_url": settings.GITHUB_URL,
        }


@pytest.mark.django_db
class TestUserAPI(object):
    def test_it_works(self, api_client):
        user = User.objects.first()
        group = GroupFactory()
        user.groups.add(group)
        res = api_client.get("/api/v3/user/")
        assert res.status_code == 200
        assert res.data == {
            "count": 1,
            "next": None,
            "previous": None,
            "results": [
                {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "groups": [{"id": group.id, "name": group.name}],
                }
            ],
        }

    def test_must_have_permission(self, api_client):
        user = UserFactory(is_superuser=False)
        api_client.force_authenticate(user=user)
        res = api_client.get("/api/v3/user/")
        assert res.status_code == 403

        ct = ContentType.objects.get_for_model(User)
        permission = Permission.objects.get(codename="change_user", content_type=ct)
        user.user_permissions.add(permission)
        user = User.objects.get(pk=user.pk)
        api_client.force_authenticate(user=user)
        res = api_client.get("/api/v3/user/")
        assert res.status_code == 200

    def test_create_user(self, api_client):
        res = api_client.post(
            "/api/v3/user/", {"first_name": "John", "last_name": "Doe", "email": "jdoe@mail.com"}
        )
        assert res.status_code == 201

        user = User.objects.get(email="jdoe@mail.com")
        assert user.username == user.email

    def test_create_user_duplicate(self, api_client):
        User.objects.create(first_name="Some", last_name="Thing", email="jdoe@mail.com")
        res = api_client.post(
            "/api/v3/user/", {"first_name": "John", "last_name": "Doe", "email": "Jdoe@mail.com"}
        )
        assert res.status_code == 400

    def test_update_user(self, api_client):
        u = UserFactory(first_name="John", last_name="Doe")
        res = api_client.patch(f"/api/v3/user/{u.id}/", {"first_name": "Jane"})
        assert res.status_code == 200
        u.refresh_from_db()
        assert u.first_name == "Jane"

        res = api_client.patch(
            f"/api/v3/user/{u.id}/", {"first_name": "Lejames", "last_name": "Bron"}
        )
        assert res.status_code == 200
        u.refresh_from_db()
        assert u.first_name == "Lejames"
        assert u.last_name == "Bron"

    def test_cannot_update_email(self, api_client):
        u = UserFactory(email="test@test.com")

        res = api_client.patch(f"/api/v3/user/{u.id}/", {"email": "foo@bar.com"})
        assert res.status_code == 200
        u.refresh_from_db()
        assert u.email == "test@test.com"

        res = api_client.put(
            f"/api/v3/user/{u.id}/",
            {"first_name": "Lejames", "last_name": "Bron", "email": "foo@bar.com"},
        )
        assert res.status_code == 200
        u.refresh_from_db()
        assert u.email == "test@test.com"

    def test_delete_user(self, api_client):
        u = UserFactory()
        res = api_client.delete(f"/api/v3/user/{u.id}/")
        assert res.status_code == 204
        assert User.objects.filter(pk=u.pk).count() == 0

    def test_cannot_delete_self(self, api_client):
        user = User.objects.first()
        res = api_client.delete(f"/api/v3/user/{user.id}/")
        assert res.status_code == 403

    def test_users_in_read_only_mode(self, api_client, settings):
        settings.ADMIN_ENABLED = False

        res = api_client.get("/api/v3/user/")
        assert res.status_code == 403
        assert res.data["detail"] == AdminEnabled.message

        res = api_client.post(
            "/api/v3/user/", {"first_name": "John", "last_name": "Doe", "email": "jdoe@mail.com"}
        )
        assert res.status_code == 403
        assert res.data["detail"] == AdminEnabled.message
        assert not Group.objects.all().exists()

        g = GroupFactory(name="abc")
        res = api_client.put(f"/api/v3/group/{g.id}/", {"name": "def"})
        assert res.status_code == 403
        assert res.data["detail"] == AdminEnabled.message


@pytest.mark.django_db
class TestGroupAPI(object):
    def test_it_works(self, api_client):
        group = GroupFactory()
        res = api_client.get("/api/v3/group/")
        assert res.status_code == 200
        assert res.data == {
            "count": 1,
            "next": None,
            "previous": None,
            "results": [{"id": group.id, "name": group.name}],
        }

    def test_must_have_permission(self, api_client):
        user = UserFactory(is_superuser=False)
        api_client.force_authenticate(user=user)
        res = api_client.get("/api/v3/group/")
        assert res.status_code == 403

        ct = ContentType.objects.get_for_model(User)
        permission = Permission.objects.get(codename="change_user", content_type=ct)
        user.user_permissions.add(permission)
        user = User.objects.get(pk=user.pk)
        api_client.force_authenticate(user=user)
        res = api_client.get("/api/v3/group/")
        assert res.status_code == 200

    def test_create_group(self, api_client):
        res = api_client.post("/api/v3/group/", {"name": "Test"})

        assert res.status_code == 201
        assert Group.objects.all().count() == 1

        g = Group.objects.first()
        assert g.name == "Test"

    def test_update_group(self, api_client):
        g = GroupFactory(name="abc")
        res = api_client.put(f"/api/v3/group/{g.id}/", {"name": "def"})
        assert res.status_code == 200
        g.refresh_from_db()
        assert g.name == "def"

    def test_delete_group(self, api_client):
        g = GroupFactory()
        res = api_client.delete(f"/api/v3/group/{g.id}/")
        assert res.status_code == 204
        assert Group.objects.all().count() == 0

    def test_add_user(self, api_client):
        user = UserFactory()
        group = GroupFactory()
        res = api_client.post(f"/api/v3/group/{group.id}/add_user/", {"user_id": user.id})
        assert res.status_code == 204
        assert user.groups.filter(pk=group.pk).count() == 1

    def test_add_user_no_user_id(self, api_client):
        group = GroupFactory()
        res = api_client.post(f"/api/v3/group/{group.id}/add_user/")
        assert res.status_code == 400

    def test_add_user_bad_user_id(self, api_client):
        group = GroupFactory()
        res = api_client.post(f"/api/v3/group/{group.id}/add_user/", {"user_id": 9999})
        assert res.status_code == 400

    def test_add_user_cannot_add_self(self, api_client):
        user = User.objects.first()
        group = GroupFactory()
        res = api_client.post(f"/api/v3/group/{group.id}/add_user/", {"user_id": user.id})
        assert res.status_code == 403

    def test_remove_user(self, api_client):
        user = UserFactory()
        group = GroupFactory()
        user.groups.add(group)
        res = api_client.post(f"/api/v3/group/{group.id}/remove_user/", {"user_id": user.id})
        assert res.status_code == 204
        assert user.groups.filter(pk=group.pk).count() == 0

    def test_remove_user_no_user_id(self, api_client):
        group = GroupFactory()
        res = api_client.post(f"/api/v3/group/{group.id}/remove_user/")
        assert res.status_code == 400

    def test_remove_user_bad_user_id(self, api_client):
        group = GroupFactory()
        res = api_client.post(f"/api/v3/group/{group.id}/remove_user/", {"user_id": 9999})
        assert res.status_code == 400

    def test_remove_user_not_in_group(self, api_client):
        user = UserFactory()
        group = GroupFactory()
        res = api_client.post(f"/api/v3/group/{group.id}/remove_user/", {"user_id": user.id})
        assert res.status_code == 400

    def test_groups_in_read_only_mode(self, api_client, settings):
        settings.ADMIN_ENABLED = False

        res = api_client.get("/api/v3/group/")
        assert res.status_code == 403
        assert res.data["detail"] == AdminEnabled.message

        res = api_client.post("/api/v3/group/", {"name": "Test"})
        assert res.status_code == 403
        assert res.data["detail"] == AdminEnabled.message
        assert not Group.objects.all().exists()

        g = GroupFactory(name="abc")
        res = api_client.put(f"/api/v3/group/{g.id}/", {"name": "def"})
        assert res.status_code == 403
        assert res.data["detail"] == AdminEnabled.message
