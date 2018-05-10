import urllib.parse as urlparse

import pytest
from rest_framework import serializers

from normandy.base.tests import Whatever
from normandy.recipes.tests import (
    ARGUMENTS_SCHEMA,
    ActionFactory,
    ApprovalRequestFactory,
    ChannelFactory,
    CountryFactory,
    LocaleFactory,
    RecipeFactory,
    SignatureFactory,
)
from normandy.recipes.api.v1.serializers import (
    ActionSerializer,
    MinimalRecipeSerializer,
    RecipeSerializer,
    SignedRecipeSerializer,
    SignatureSerializer,
)


@pytest.mark.django_db()
class TestRecipeSerializer:
    def test_it_works(self, rf):
        channel = ChannelFactory()
        country = CountryFactory()
        locale = LocaleFactory()
        recipe = RecipeFactory(arguments={'foo': 'bar'}, channels=[channel], countries=[country],
                               locales=[locale])
        approval = ApprovalRequestFactory(revision=recipe.latest_revision)
        action = recipe.action
        serializer = RecipeSerializer(recipe, context={'request': rf.get('/')})

        assert serializer.data == {
            'name': recipe.name,
            'id': recipe.id,
            'last_updated': Whatever(),
            'enabled': recipe.enabled,
            'extra_filter_expression': recipe.extra_filter_expression,
            'filter_expression': recipe.filter_expression,
            'revision_id': recipe.revision_id,
            'action': action.name,
            'arguments': {
                'foo': 'bar',
            },
            'channels': [channel.slug],
            'countries': [country.code],
            'locales': [locale.code],
            'is_approved': False,
            'latest_revision_id': recipe.latest_revision.id,
            'approved_revision_id': None,
            'approval_request': {
                'id': approval.id,
                'created': Whatever(),
                'creator': Whatever(),
                'approved': None,
                'approver': None,
                'comment': None,
            },
            'identicon_seed': Whatever.startswith('v1:'),
        }

    # If the action specified cannot be found, raise validation
    # error indicating the arguments schema could not be loaded
    def test_validation_with_wrong_action(self):
        serializer = RecipeSerializer(data={
            'action': 'action-that-doesnt-exist', 'arguments': {}
        })

        with pytest.raises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

        assert serializer.errors['action'] == [
            'Object with name=action-that-doesnt-exist does not exist.'
        ]

    # If the action can be found, raise validation error
    # with the arguments error formatted appropriately
    def test_validation_with_wrong_arguments(self):
        ActionFactory(
            name='show-heartbeat',
            arguments_schema=ARGUMENTS_SCHEMA
        )

        serializer = RecipeSerializer(data={
            'name': 'test',
            'extra_filter_expression': 'true',
            'action': 'show-heartbeat',
            'arguments': {
                'surveyId': '',
                'surveys': [
                    {'title': '', 'weight': 1},
                    {'title': 'bar', 'weight': 1},
                    {'title': 'foo', 'weight': 0},
                    {'title': 'baz', 'weight': 'lorem ipsum'}
                ]
            }
        })

        with pytest.raises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

        assert serializer.errors['arguments'] == {
            'surveyId': 'This field may not be blank.',
            'surveys': {
                0: {'title': 'This field may not be blank.'},
                2: {'weight': '0 is less than the minimum of 1'},
                3: {'weight': '\'lorem ipsum\' is not of type \'integer\''}
            }
        }

    def test_validation_with_invalid_filter_expression(self):
        ActionFactory(
            name='show-heartbeat',
            arguments_schema=ARGUMENTS_SCHEMA
        )

        serializer = RecipeSerializer(data={
            'name': 'bar',
            'enabled': True,
            'extra_filter_expression': 'inv(-alsid',
            'action': 'show-heartbeat',
            'arguments': {
                'surveyId': 'lorem-ipsum-dolor',
                'surveys': [
                    {'title': 'adipscing', 'weight': 1},
                    {'title': 'consequetar', 'weight': 1}
                ]
            }
        })

        assert not serializer.is_valid()
        assert serializer.errors['extra_filter_expression'] == [
            'Could not parse expression: inv(-alsid'
        ]

    def test_validation_with_jexl_exception(self):
        ActionFactory(
            name='show-heartbeat',
            arguments_schema=ARGUMENTS_SCHEMA
        )
        serializer = RecipeSerializer(data={
            'name': 'bar',
            'enabled': True,
            'extra_filter_expression': '"\\',
            'action': 'show-heartbeat',
            'arguments': {
                'surveyId': 'lorem-ipsum-dolor',
                'surveys': [
                    {'title': 'adipscing', 'weight': 1},
                    {'title': 'consequetar', 'weight': 1}
                ]
            }
        })

        assert not serializer.is_valid()
        assert serializer.errors['extra_filter_expression'] == [
            'Could not parse expression: "\\'
        ]

    def test_validation_with_valid_data(self):
        mockAction = ActionFactory(
            name='show-heartbeat',
            arguments_schema=ARGUMENTS_SCHEMA
        )

        channel = ChannelFactory(slug='release')
        country = CountryFactory(code='CA')
        locale = LocaleFactory(code='en-US')

        serializer = RecipeSerializer(data={
            'name': 'bar', 'enabled': True, 'extra_filter_expression': '[]',
            'action': 'show-heartbeat',
            'channels': ['release'],
            'countries': ['CA'],
            'locales': ['en-US'],
            'arguments': {
                'surveyId': 'lorem-ipsum-dolor',
                'surveys': [
                    {'title': 'adipscing', 'weight': 1},
                    {'title': 'consequetar', 'weight': 1}
                ]
            }
        })

        assert serializer.is_valid()
        assert serializer.validated_data == {
            'name': 'bar',
            'extra_filter_expression': '[]',
            'action': mockAction,
            'arguments': {
                'surveyId': 'lorem-ipsum-dolor',
                'surveys': [
                    {'title': 'adipscing', 'weight': 1},
                    {'title': 'consequetar', 'weight': 1}
                ]
            },
            'channels': [channel],
            'countries': [country],
            'locales': [locale],
        }
        assert serializer.errors == {}


@pytest.mark.django_db()
class TestActionSerializer:
    def test_it_uses_cdn_url(self, rf, settings):
        settings.CDN_URL = 'https://example.com/cdn/'
        action = ActionFactory()
        serializer = ActionSerializer(action, context={'request': rf.get('/')})
        assert serializer.data['implementation_url'].startswith(settings.CDN_URL)


@pytest.mark.django_db()
class TestSignedRecipeSerializer:
    def test_it_works_with_signature(self, rf):
        recipe = RecipeFactory(signed=True)
        context = {'request': rf.get('/')}
        combined_serializer = SignedRecipeSerializer(instance=recipe, context=context)
        recipe_serializer = MinimalRecipeSerializer(instance=recipe, context=context)

        # Testing for shape of data, not contents
        assert combined_serializer.data == {
            'signature': {
                'signature': Whatever(),
                'timestamp': Whatever(),
                'x5u': Whatever(),
                'public_key': Whatever(),
            },
            'recipe': recipe_serializer.data,
        }

    def test_it_works_with_no_signature(self, rf):
        recipe = RecipeFactory(signed=False)
        action = recipe.action
        serializer = SignedRecipeSerializer(instance=recipe, context={'request': rf.get('/')})

        assert serializer.data == {
            'signature': None,
            'recipe': {
                'name': recipe.name,
                'id': recipe.id,
                'enabled': recipe.enabled,
                'filter_expression': recipe.filter_expression,
                'revision_id': recipe.revision_id,
                'action': action.name,
                'arguments': recipe.arguments,
                'last_updated': Whatever(),
                'is_approved': False,
            }
        }


@pytest.mark.django_db()
class TestSignatureSerializer:
    def test_it_works(self):
        signature = SignatureFactory()
        serializer = SignatureSerializer(instance=signature)

        assert serializer.data == {
            'signature': Whatever.regex(r'[a-f0-9]{40}'),
            'x5u': Whatever.startswith(signature.x5u),
            'timestamp': Whatever.iso8601(),
            'public_key': Whatever.regex(r'[a-zA-Z0-9/+]{160}')
        }

    def test_it_cachebusts_x5u(self, settings):
        signature = SignatureFactory()

        # If none, do not cache bust
        settings.AUTOGRAPH_X5U_CACHE_BUST = None
        serializer = SignatureSerializer(instance=signature)
        url_parts = list(urlparse.urlparse(serializer.data['x5u']))
        query = urlparse.parse_qs(url_parts[4])
        assert 'cachebust' not in query

        # If set, cachebust using the value
        settings.AUTOGRAPH_X5U_CACHE_BUST = 'new'
        serializer = SignatureSerializer(instance=signature)
        url_parts = list(urlparse.urlparse(serializer.data['x5u']))
        query = urlparse.parse_qs(url_parts[4])
        assert 'cachebust' in query
        assert len(query['cachebust']) == 1
        assert query['cachebust'][0] == 'new'
