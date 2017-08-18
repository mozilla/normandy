import hashlib
from unittest.mock import patch
from urllib.parse import quote as url_quote

from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest
from rest_framework.reverse import reverse

from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.base.tests import UserFactory, Whatever
from normandy.base.utils import aware_datetime, canonical_json_dumps
from normandy.recipes.models import ApprovalRequest, Recipe
from normandy.recipes.tests import (
    ActionFactory,
    ApprovalRequestFactory,
    ChannelFactory,
    CountryFactory,
    LocaleFactory,
    RecipeFactory,
    fake_sign,
)


@pytest.mark.django_db
class TestActionAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v1/action/')
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_actions(self, api_client):
        action = ActionFactory(
            name='foo',
            implementation='foobar',
            arguments_schema={'type': 'object'}
        )

        res = api_client.get('/api/v1/action/')
        action_url = reverse('recipes:action-implementation', kwargs={
            'name': action.name,
            'impl_hash': action.implementation_hash,
        })
        assert res.status_code == 200
        assert res.data == [
            {
                'name': 'foo',
                'implementation_url': Whatever.endswith(action_url),
                'arguments_schema': {'type': 'object'}
            }
        ]

    def test_name_validation(self, api_client):
        """Ensure the name field accepts _any_ valid slug."""
        # Slugs can contain alphanumerics plus _ and -.
        action = ActionFactory(name='foo-bar_baz2')

        res = api_client.get('/api/v1/action/foo-bar_baz2/')
        assert res.status_code == 200
        assert res.data['name'] == action.name

    def test_list_view_includes_cache_headers(self, api_client):
        res = api_client.get('/api/v1/action/')
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_detail_view_includes_cache_headers(self, api_client):
        action = ActionFactory()
        res = api_client.get('/api/v1/action/{name}/'.format(name=action.name))
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_list_sets_no_cookies(self, api_client):
        res = api_client.get('/api/v1/action/')
        assert res.status_code == 200
        assert 'Cookies' not in res

    def test_detail_sets_no_cookies(self, api_client):
        action = ActionFactory()
        res = api_client.get('/api/v1/action/{name}/'.format(name=action.name))
        assert res.status_code == 200
        assert res.client.cookies == {}


@pytest.mark.django_db
class TestImplementationAPI(object):
    def test_it_serves_implementations(self, api_client):
        action = ActionFactory()
        res = api_client.get('/api/v1/action/{name}/implementation/{hash}/'.format(
            name=action.name,
            hash=action.implementation_hash,
        ))
        assert res.status_code == 200
        assert res.content.decode() == action.implementation
        assert res['Content-Type'] == 'application/javascript; charset=utf-8'

    def test_it_404s_if_hash_doesnt_match(self, api_client):
        action = ActionFactory(implementation='asdf')
        bad_hash = hashlib.sha1('nomatch'.encode()).hexdigest()
        res = api_client.get('/api/v1/action/{name}/implementation/{hash}/'.format(
            name=action.name,
            hash=bad_hash,
        ))
        assert res.status_code == 404
        assert res.content.decode() == '/* Hash does not match current stored action. */'
        assert res['Content-Type'] == 'application/javascript; charset=utf-8'

    def test_it_includes_cache_headers(self, api_client, settings):
        # Note: Can't override the cache time setting, since it is read
        # when invoking the decorator at import time. Changing it would
        # require mocking, and that isn't worth it.
        action = ActionFactory()
        res = api_client.get('/api/v1/action/{name}/implementation/{hash}/'.format(
            name=action.name,
            hash=action.implementation_hash,
        ))
        assert res.status_code == 200

        max_age = 'max-age={}'.format(settings.ACTION_IMPLEMENTATION_CACHE_TIME)
        assert max_age in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_sets_no_cookies(self, api_client):
        action = ActionFactory()
        res = api_client.get('/api/v1/action/{name}/implementation/{hash}/'.format(
            name=action.name,
            hash=action.implementation_hash,
        ))
        assert res.status_code == 200
        assert res.client.cookies == {}

    # v57 and v69 of Normandy need to coexist for a bit of time,
    # so test that both v69 and v57 type are recognized

    def test_it_supports_v57_hash_formats(self):
        action = ActionFactory()
        impl_hash = 'c356d1cacb7787db864394ecc88977fd7da35f76'
        url = reverse(
            'recipes:action-implementation',
            kwargs={'name': action.name, 'impl_hash': impl_hash},
        )
        action_name = url_quote(action.name)
        assert url.endswith(f'/api/v1/action/{action_name}/implementation/{impl_hash}/')

    def test_it_supports_v69_hash_formats(self):
        action = ActionFactory()
        impl_hash = 'sha384-FkJOz1XrkSu39biGtknNfSLPZnybaTrPdJwLFqungYwg9FjOxXxQBzmkDjS7p-wT'
        action_name = url_quote(action.name)
        url = reverse(
            'recipes:action-implementation',
            kwargs={'name': action.name, 'impl_hash': impl_hash},
        )
        assert url.endswith(f"/api/v1/action/{action_name}/implementation/{impl_hash}/")


@pytest.mark.django_db
class TestRecipeAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_recipes(self, api_client):
        recipe = RecipeFactory()

        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200
        assert res.data[0]['name'] == recipe.name

    def test_it_can_create_recipes(self, api_client):
        action = ActionFactory()

        # Enabled recipe
        res = api_client.post('/api/v1/recipe/', {
            'name': 'Test Recipe',
            'action': action.name,
            'arguments': {},
            'extra_filter_expression': 'whatever',
            'enabled': True
        })
        assert res.status_code == 201

        recipes = Recipe.objects.all()
        assert recipes.count() == 1

    def test_it_can_create_disabled_recipes(self, api_client):
        action = ActionFactory()

        # Disabled recipe
        res = api_client.post('/api/v1/recipe/', {
            'name': 'Test Recipe',
            'action': action.name,
            'arguments': {},
            'extra_filter_expression': 'whatever',
            'enabled': False
        })
        assert res.status_code == 201

        recipes = Recipe.objects.all()
        assert recipes.count() == 1

    def test_it_can_edit_recipes(self, api_client):
        recipe = RecipeFactory(name='unchanged', extra_filter_expression='true')
        old_revision_id = recipe.revision_id

        res = api_client.patch('/api/v1/recipe/%s/' % recipe.id, {
            'name': 'changed',
            'extra_filter_expression': 'false',
        })
        assert res.status_code == 200

        recipe = Recipe.objects.all()[0]
        assert recipe.name == 'changed'
        assert recipe.filter_expression == 'false'
        assert recipe.revision_id != old_revision_id

    def test_creation_when_action_does_not_exist(self, api_client):
        res = api_client.post('/api/v1/recipe/', {'name': 'Test Recipe',
                                                  'action': 'fake-action',
                                                  'arguments': '{}'})
        assert res.status_code == 400

        recipes = Recipe.objects.all()
        assert recipes.count() == 0

    def test_creation_when_arguments_are_invalid(self, api_client):
        ActionFactory(
            name='foobarbaz',
            arguments_schema={
                'type': 'object',
                'properties': {'message': {'type': 'string'}},
                'required': ['message']
            }
        )
        res = api_client.post('/api/v1/recipe/', {'name': 'Test Recipe',
                                                  'enabled': True,
                                                  'extra_filter_expression': 'true',
                                                  'action': 'foobarbaz',
                                                  'arguments': {'message': ''}})
        assert res.status_code == 400

        recipes = Recipe.objects.all()
        assert recipes.count() == 0

    def test_it_can_change_action_for_recipes(self, api_client):
        recipe = RecipeFactory()
        action = ActionFactory()

        res = api_client.patch('/api/v1/recipe/%s/' % recipe.id, {'action': action.name})
        assert res.status_code == 200

        recipe = Recipe.objects.get(pk=recipe.id)
        assert recipe.action == action

    def test_it_can_change_arguments_for_recipes(self, api_client):
        recipe = RecipeFactory(arguments_json='{}')
        action = ActionFactory(
            name='foobarbaz',
            arguments_schema={
                'type': 'object',
                'properties': {'message': {'type': 'string'}},
                'required': ['message']
            }
        )

        arguments = {'message': 'test message'}

        res = api_client.patch('/api/v1/recipe/%s/' % recipe.id, {
            'action': action.name, 'arguments': arguments})
        assert res.status_code == 200

        recipe = Recipe.objects.get(pk=recipe.id)
        assert recipe.arguments == arguments

    def test_it_can_delete_recipes(self, api_client):
        recipe = RecipeFactory()

        res = api_client.delete('/api/v1/recipe/%s/' % recipe.id)
        assert res.status_code == 204

        recipes = Recipe.objects.all()
        assert recipes.count() == 0

    def test_available_if_admin_enabled(self, api_client, settings):
        settings.ADMIN_ENABLED = True
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200
        assert res.data == []

    def test_readonly_if_admin_disabled(self, api_client, settings):
        settings.ADMIN_ENABLED = False
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200

        recipe = RecipeFactory(name='unchanged')
        res = api_client.patch('/api/v1/recipe/%s/' % recipe.id, {'name': 'changed'})
        assert res.status_code == 403
        assert res.data['detail'] == AdminEnabledOrReadOnly.message

    def test_history(self, api_client):
        recipe = RecipeFactory(name='version 1')
        recipe.revise(name='version 2')
        recipe.revise(name='version 3')

        res = api_client.get('/api/v1/recipe/%s/history/' % recipe.id)

        assert res.data[0]['recipe']['name'] == 'version 3'
        assert res.data[1]['recipe']['name'] == 'version 2'
        assert res.data[2]['recipe']['name'] == 'version 1'

    def test_it_can_enable_recipes(self, api_client):
        recipe = RecipeFactory(enabled=False, approver=UserFactory())

        res = api_client.post('/api/v1/recipe/%s/enable/' % recipe.id)
        assert res.status_code == 200
        assert res.data['enabled'] is True

        recipe = Recipe.objects.all()[0]
        assert recipe.enabled

    def test_cannot_enable_unapproved_recipes(self, api_client):
        recipe = RecipeFactory(enabled=False)

        res = api_client.post('/api/v1/recipe/%s/enable/' % recipe.id)
        assert res.status_code == 409
        assert res.data['enabled'] == 'Cannot enable a recipe that is not approved.'

    def test_it_can_disable_recipes(self, api_client):
        recipe = RecipeFactory(approver=UserFactory(), enabled=True)

        res = api_client.post('/api/v1/recipe/%s/disable/' % recipe.id)
        assert res.status_code == 200
        assert res.data['enabled'] is False

        recipe = Recipe.objects.all()[0]
        assert not recipe.is_approved
        assert not recipe.enabled

    def test_filtering_by_enabled_lowercase(self, api_client):
        r1 = RecipeFactory(approver=UserFactory(), enabled=True)
        RecipeFactory(enabled=False)

        res = api_client.get('/api/v1/recipe/?enabled=true')
        assert res.status_code == 200
        assert [r['id'] for r in res.data] == [r1.id]

    def test_filtering_by_enabled_fuzz(self, api_client):
        """
        Test that we don't return 500 responses when we get unexpected boolean filters.

        This was a real case that showed up in our error logging.
        """
        url = "/api/v1/recipe/?enabled=javascript%3a%2f*<%2fscript><svg%2fonload%3d'%2b%2f'%2f%2b"
        res = api_client.get(url)
        assert res.status_code == 400
        assert res.data == {
            'messages': [
                "'javascript:/*</script><svg/onload='+/'/+' value must be either True or False.",
            ],
        }

    def test_list_view_includes_cache_headers(self, api_client):
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200
        # It isn't important to assert a particular value for max_age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_signed_view_includes_cache_headers(self, api_client):
        res = api_client.get('/api/v1/recipe/signed/')
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_detail_view_includes_cache_headers(self, api_client):
        recipe = RecipeFactory()
        res = api_client.get(f'/api/v1/recipe/{recipe.id}/')
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_signed_listing_works(self, api_client):
        r1 = RecipeFactory(signed=True)
        res = api_client.get('/api/v1/recipe/signed/')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['recipe']['id'] == r1.id
        assert res.data[0]['signature']['signature'] == r1.signature.signature

    def test_signed_only_lists_signed_recipes(self, api_client):
        r1 = RecipeFactory(signed=True)
        r2 = RecipeFactory(signed=True)
        RecipeFactory(signed=False)
        res = api_client.get('/api/v1/recipe/signed/')
        assert res.status_code == 200
        assert len(res.data) == 2

        res.data.sort(key=lambda r: r['recipe']['id'])

        assert res.data[0]['recipe']['id'] == r1.id
        assert res.data[0]['signature']['signature'] == r1.signature.signature
        assert res.data[1]['recipe']['id'] == r2.id
        assert res.data[1]['signature']['signature'] == r2.signature.signature

    def test_signed_listing_filters_by_enabled(Self, api_client):
        enabled_recipe = RecipeFactory(signed=True, approver=UserFactory(), enabled=True)
        disabled_recipe = RecipeFactory(signed=True, enabled=False)

        res = api_client.get('/api/v1/recipe/signed/?enabled=1')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['recipe']['id'] == enabled_recipe.id

        res = api_client.get('/api/v1/recipe/signed/?enabled=0')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['recipe']['id'] == disabled_recipe.id

    def test_list_sets_no_cookies(self, api_client):
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200
        assert 'Cookies' not in res

    def test_detail_sets_no_cookies(self, api_client):
        recipe = RecipeFactory()
        res = api_client.get('/api/v1/recipe/{id}/'.format(id=recipe.id))
        assert res.status_code == 200
        assert res.client.cookies == {}

    def test_list_filter_status(self, api_client):
        r1 = RecipeFactory(enabled=False)
        r2 = RecipeFactory(approver=UserFactory(), enabled=True)

        res = api_client.get('/api/v1/recipe/?status=enabled')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['id'] == r2.id

        res = api_client.get('/api/v1/recipe/?status=disabled')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['id'] == r1.id

    def test_list_filter_channels(self, api_client):
        r1 = RecipeFactory(channels=[ChannelFactory(slug='beta')])
        r2 = RecipeFactory(channels=[ChannelFactory(slug='release')])

        res = api_client.get('/api/v1/recipe/?channels=beta')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['id'] == r1.id

        res = api_client.get('/api/v1/recipe/?channels=beta,release')
        assert res.status_code == 200
        assert len(res.data) == 2
        for recipe in res.data:
            assert recipe['id'] in [r1.id, r2.id]

    def test_list_filter_countries(self, api_client):
        r1 = RecipeFactory(countries=[CountryFactory(code='US')])
        r2 = RecipeFactory(countries=[CountryFactory(code='CA')])

        res = api_client.get('/api/v1/recipe/?countries=US')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['id'] == r1.id

        res = api_client.get('/api/v1/recipe/?countries=US,CA')
        assert res.status_code == 200
        assert len(res.data) == 2
        for recipe in res.data:
            assert recipe['id'] in [r1.id, r2.id]

    def test_list_filter_locales(self, api_client):
        r1 = RecipeFactory(locales=[LocaleFactory(code='en-US')])
        r2 = RecipeFactory(locales=[LocaleFactory(code='fr-CA')])

        res = api_client.get('/api/v1/recipe/?locales=en-US')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['id'] == r1.id

        res = api_client.get('/api/v1/recipe/?locales=en-US,fr-CA')
        assert res.status_code == 200
        assert len(res.data) == 2
        for recipe in res.data:
            assert recipe['id'] in [r1.id, r2.id]

    def test_list_filter_text(self, api_client):
        r1 = RecipeFactory(name='first', extra_filter_expression='1 + 1 == 2')
        r2 = RecipeFactory(name='second', extra_filter_expression='one + one == two')

        res = api_client.get('/api/v1/recipe/?text=first')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['id'] == r1.id

        res = api_client.get('/api/v1/recipe/?text=one')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['id'] == r2.id

        res = api_client.get('/api/v1/recipe/?text=t')
        assert res.status_code == 200
        assert len(res.data) == 2
        for recipe in res.data:
            assert recipe['id'] in [r1.id, r2.id]

    def test_update_recipe_action(self, api_client):
        r = RecipeFactory()
        a = ActionFactory(name='test')

        res = api_client.patch(f'/api/v1/recipe/{r.pk}/', {'action': 'test'})
        assert res.status_code == 200

        r.refresh_from_db()
        assert r.action == a

    def test_update_recipe_locale(self, api_client):
        l1 = LocaleFactory(code='fr-FR')
        l2 = LocaleFactory(code='en-US')
        r = RecipeFactory(locales=[l1])

        res = api_client.patch(f'/api/v1/recipe/{r.pk}/', {'locales': ['en-US']})
        assert res.status_code == 200

        r.refresh_from_db()
        assert list(r.locales.all()) == [l2]

    def test_update_recipe_country(self, api_client):
        c1 = CountryFactory(code='US')
        c2 = CountryFactory(code='CA')
        r = RecipeFactory(countries=[c1])

        res = api_client.patch(f'/api/v1/recipe/{r.pk}/', {'countries': ['CA']})
        assert res.status_code == 200

        r.refresh_from_db()
        assert list(r.countries.all()) == [c2]

    def test_update_recipe_channel(self, api_client):
        c1 = ChannelFactory(slug='release')
        c2 = ChannelFactory(slug='beta')
        r = RecipeFactory(channels=[c1])

        res = api_client.patch(f'/api/v1/recipe/{r.pk}/', {'channels': ['beta']})
        assert res.status_code == 200

        r.refresh_from_db()
        assert list(r.channels.all()) == [c2]


@pytest.mark.django_db
class TestRecipeRevisionAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v1/recipe_revision/')
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_revisions(self, api_client):
        recipe = RecipeFactory()
        res = api_client.get('/api/v1/recipe_revision/%s/' % recipe.latest_revision.id)
        assert res.status_code == 200
        assert res.data['id'] == recipe.latest_revision.id

    def test_request_approval(self, api_client):
        recipe = RecipeFactory()
        res = api_client.post(
            '/api/v1/recipe_revision/{}/request_approval/'.format(recipe.latest_revision.id))
        assert res.status_code == 201
        assert res.data['id'] == recipe.latest_revision.approval_request.id

    def test_cannot_open_second_approval_request(self, api_client):
        recipe = RecipeFactory()
        ApprovalRequestFactory(revision=recipe.latest_revision)
        res = api_client.post(
            '/api/v1/recipe_revision/{}/request_approval/'.format(recipe.latest_revision.id))
        assert res.status_code == 400


@pytest.mark.django_db
class TestApprovalRequestAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v1/approval_request/')
        assert res.status_code == 200
        assert res.data == []

    def test_approve(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        res = api_client.post('/api/v1/approval_request/{}/approve/'.format(a.id),
                              {'comment': 'r+'})
        assert res.status_code == 200

        r.refresh_from_db()
        assert r.is_approved
        assert r.approved_revision.approval_request.comment == 'r+'

    def test_approve_no_comment(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        res = api_client.post('/api/v1/approval_request/{}/approve/'.format(a.id))
        assert res.status_code == 400
        assert res.data['comment'] == 'This field is required.'

    def test_approve_not_actionable(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        a.approve(UserFactory(), 'r+')

        res = api_client.post('/api/v1/approval_request/{}/approve/'.format(a.id),
                              {'comment': 'r+'})
        assert res.status_code == 400
        assert res.data['error'] == 'This approval request has already been approved or rejected.'

    def test_reject(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        res = api_client.post('/api/v1/approval_request/{}/reject/'.format(a.id),
                              {'comment': 'r-'})
        assert res.status_code == 200

        r.latest_revision.approval_request.refresh_from_db()
        assert r.latest_revision.approval_status == r.latest_revision.REJECTED
        assert r.latest_revision.approval_request.comment == 'r-'

    def test_reject_no_comment(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        res = api_client.post('/api/v1/approval_request/{}/reject/'.format(a.id))
        assert res.status_code == 400
        assert res.data['comment'] == 'This field is required.'

    def test_reject_not_actionable(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        a.approve(UserFactory(), 'r+')

        res = api_client.post('/api/v1/approval_request/{}/reject/'.format(a.id),
                              {'comment': '-r'})
        assert res.status_code == 400
        assert res.data['error'] == 'This approval request has already been approved or rejected.'

    def test_close(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        res = api_client.post('/api/v1/approval_request/{}/close/'.format(a.id))
        assert res.status_code == 204

        with pytest.raises(ApprovalRequest.DoesNotExist):
            ApprovalRequest.objects.get(pk=a.pk)


@pytest.mark.django_db
class TestClassifyClient(object):
    def test_it_works(self, api_client):
        get_country_code_patch = patch('normandy.recipes.models.get_country_code')
        timezone_patch = patch('normandy.base.middleware.timezone')

        with get_country_code_patch as get_country_code, timezone_patch as timezone:
            get_country_code.return_value = 'us'
            timezone.now.return_value = aware_datetime(2016, 1, 1)
            res = api_client.get('/api/v1/classify_client/')

        assert res.status_code == 200
        assert res.data == {
            'country': 'us',
            'request_time': '2016-01-01T00:00:00Z',
        }

    def test_makes_no_db_queries(self, client):
        queries = CaptureQueriesContext(connection)
        with queries:
            res = client.get('/api/v1/classify_client/')
            assert res.status_code == 200
        assert len(queries) == 0

    def test_sets_no_cookies(self, api_client):
        res = api_client.get('/api/v1/classify_client/')
        assert res.status_code == 200
        assert res.client.cookies == {}


@pytest.mark.django_db
class TestApprovalFlow(object):

    def verify_signatures(self, api_client, expected_count=None):
        res = api_client.get('/api/v1/recipe/signed/')
        assert res.status_code == 200
        signed_data = res.json()

        if expected_count is not None:
            assert len(signed_data) == expected_count

        for recipe_and_signature in signed_data:
            recipe = recipe_and_signature['recipe']
            expected_signature = recipe_and_signature['signature']['signature']
            data = canonical_json_dumps(recipe).encode()
            actual_signature = fake_sign([data])[0]['signature']
            assert actual_signature == expected_signature

    def test_full_approval_flow(self, settings, api_client, mocked_autograph):
        settings.PEER_APPROVAL_ENFORCED = True

        action = ActionFactory()
        user1 = UserFactory(is_superuser=True)
        user2 = UserFactory(is_superuser=True)
        api_client.force_authenticate(user1)

        # Create a recipe
        res = api_client.post('/api/v1/recipe/', {
            'action': action.name,
            'arguments': {},
            'name': 'test recipe',
            'extra_filter_expression': 'counter == 0',
            'enabled': 'false',
        })
        assert res.status_code == 201
        recipe_data_0 = res.json()

        # Request approval for it
        res = api_client.post('/api/v1/recipe_revision/{}/request_approval/'
                              .format(recipe_data_0['revision_id']))
        approval_data = res.json()
        assert res.status_code == 201

        # The requester isn't allowed to approve a recipe
        res = api_client.post('/api/v1/approval_request/{}/approve/'.format(approval_data['id']),
                              {'comment': 'r+'})
        assert res.status_code == 403  # Forbidden

        # Approve the recipe
        api_client.force_authenticate(user2)
        res = api_client.post('/api/v1/approval_request/{}/approve/'.format(approval_data['id']),
                              {'comment': 'r+'})
        assert res.status_code == 200

        # It is now visible in the API
        res = api_client.get('/api/v1/recipe/{}/'.format(recipe_data_0['id']))
        assert res.status_code == 200
        recipe_data_1 = res.json()
        self.verify_signatures(api_client, expected_count=1)

        # Make another change
        api_client.force_authenticate(user1)
        res = api_client.patch('/api/v1/recipe/{}/'.format(recipe_data_1['id']), {
            'extra_filter_expression': 'counter == 1',
        })
        assert res.status_code == 200

        # The change should not be visible yet, since it isn't approved
        res = api_client.get('/api/v1/recipe/{}/'.format(recipe_data_1['id']))
        assert res.status_code == 200
        recipe_data_2 = res.json()
        assert recipe_data_2['extra_filter_expression'] == 'counter == 0'
        self.verify_signatures(api_client, expected_count=1)

        # Request approval for the change
        res = api_client.post('/api/v1/recipe_revision/{}/request_approval/'
                              .format(recipe_data_2['latest_revision_id']))
        approval_data = res.json()
        recipe_data_2['approval_request'] = approval_data
        assert res.status_code == 201

        # The change should not be visible yet, since it isn't approved
        res = api_client.get('/api/v1/recipe/{}/'.format(recipe_data_1['id']))
        assert res.status_code == 200
        assert res.json() == recipe_data_2
        self.verify_signatures(api_client, expected_count=1)

        # Reject the change
        api_client.force_authenticate(user2)
        res = api_client.post('/api/v1/approval_request/{}/reject/'.format(approval_data['id']),
                              {'comment': 'r-'})
        approval_data = res.json()
        recipe_data_2['approval_request'] = approval_data
        assert res.status_code == 200

        # The change should not be visible yet, since it isn't approved
        res = api_client.get('/api/v1/recipe/{}/'.format(recipe_data_1['id']))
        assert res.status_code == 200
        assert res.json() == recipe_data_2
        self.verify_signatures(api_client, expected_count=1)

        # Make a third version of the recipe
        api_client.force_authenticate(user1)
        res = api_client.patch('/api/v1/recipe/{}/'.format(recipe_data_1['id']), {
            'extra_filter_expression': 'counter == 2',
        })
        recipe_data_3 = res.json()
        assert res.status_code == 200

        # Request approval
        res = api_client.post('/api/v1/recipe_revision/{}/request_approval/'
                              .format(recipe_data_3['latest_revision_id']))
        approval_data = res.json()
        assert res.status_code == 201

        # Approve the change
        api_client.force_authenticate(user2)
        res = api_client.post('/api/v1/approval_request/{}/approve/'.format(approval_data['id']),
                              {'comment': 'r+'})
        assert res.status_code == 200

        # The change should be visible now, since it is approved
        res = api_client.get('/api/v1/recipe/{}/'.format(recipe_data_1['id']))
        assert res.status_code == 200
        recipe_data_4 = res.json()
        assert recipe_data_4['extra_filter_expression'] == 'counter == 2'
        assert recipe_data_4['latest_revision_id'] == recipe_data_4['revision_id']
        self.verify_signatures(api_client, expected_count=1)

    def test_cancel_approval(self, api_client, mocked_autograph):
        action = ActionFactory()
        user1 = UserFactory(is_superuser=True)
        user2 = UserFactory(is_superuser=True)
        api_client.force_authenticate(user1)

        # Create a recipe
        res = api_client.post('/api/v1/recipe/', {
            'action': action.name,
            'arguments': {},
            'name': 'test recipe',
            'extra_filter_expression': 'counter == 0',
            'enabled': 'false',
        })
        assert res.status_code == 201
        recipe_id = res.json()['id']
        revision_id = res.json()['latest_revision_id']

        # Request approval
        res = api_client.post(f'/api/v1/recipe_revision/{revision_id}/request_approval/')
        assert res.status_code == 201
        approval_request_id = res.json()['id']

        # Approve the recipe
        api_client.force_authenticate(user2)
        res = api_client.post(
            f'/api/v1/approval_request/{approval_request_id}/approve/',
            {'comment': 'r+'}
        )
        assert res.status_code == 200

        # Make another change
        api_client.force_authenticate(user1)
        res = api_client.patch(
            f'/api/v1/recipe/{recipe_id}/',
            {'extra_filter_expression': 'counter == 1'}
        )
        assert res.status_code == 200
        revision_id = res.json()['latest_revision_id']

        # Request approval for the second change
        res = api_client.post(f'/api/v1/recipe_revision/{revision_id}/request_approval/')
        approval_request_id = res.json()['id']
        assert res.status_code == 201

        # Cancel the approval request
        res = api_client.post(f'/api/v1/approval_request/{approval_request_id}/close/')
        assert res.status_code == 204

        # The API should still have correct signatures
        self.verify_signatures(api_client, expected_count=1)
