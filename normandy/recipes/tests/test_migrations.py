import hashlib
import pytest

from django.utils import timezone

from normandy.base.tests import MigrationTest


@pytest.mark.django_db
class Test0003Through0005(MigrationTest):
    def _get_filter_expression_for_revision(self, revision):
        parts = []

        if revision.locales.count():
            locales = ', '.join(["'{}'".format(l.code) for l in revision.locales.all()])
            parts.append('normandy.locale in [{}]'.format(locales))

        if revision.countries.count():
            countries = ', '.join(["'{}'".format(c.code) for c in revision.countries.all()])
            parts.append('normandy.country in [{}]'.format(countries))

        if revision.channels.count():
            channels = ', '.join(["'{}'".format(c.slug) for c in revision.channels.all()])
            parts.append('normandy.channel in [{}]'.format(channels))

        if revision.extra_filter_expression:
            parts.append(revision.extra_filter_expression)

        expression = ') && ('.join(parts)

        return '({})'.format(expression) if len(parts) > 1 else expression

    def _hash_revision(self, revision):
        data = '{}{}{}{}{}{}'.format(revision.recipe.id, revision.created, revision.name,
                                     revision.action.id, revision.arguments_json,
                                     self._get_filter_expression_for_revision(revision))
        return hashlib.sha256(data.encode()).hexdigest()

    def test_forwards(self, migrations):
        # Get the pre-migration models
        old_apps = migrations.migrate('recipes', '0002_auto_20180406_1701')
        Recipe = old_apps.get_model('recipes', 'Recipe')
        Action = old_apps.get_model('recipes', 'Action')
        RecipeRevision = old_apps.get_model('recipes', 'RecipeRevision')
        ApprovalRequest = old_apps.get_model('recipes', 'ApprovalRequest')
        Channel = old_apps.get_model('recipes', 'Channel')
        Country = old_apps.get_model('recipes', 'Country')
        Locale = old_apps.get_model('recipes', 'Locale')
        User = old_apps.get_model('auth', 'User')

        # Create test data
        recipe = Recipe.objects.create()
        action = Action.objects.create()
        channel1 = Channel.objects.create(slug='beta')
        channel2 = Channel.objects.create(slug='release')
        country1 = Country.objects.create(code='US')
        country2 = Country.objects.create(code='CA')
        locale1 = Locale.objects.create(code='en-US')
        locale2 = Locale.objects.create(code='fr-CA')
        user = User.objects.create(username='test')

        revision_data = {
            'recipe': recipe,
            'action': action,
            'user': user,
            'name': 'Test Revision',
            'identicon_seed': 'v1:test',
            'created': timezone.now(),
            'updated': timezone.now(),
            'comment': 'Test comment.',
            'arguments_json': '{"arg1": "val1"}',
            'extra_filter_expression': '1 == 1',
        }

        revision = RecipeRevision.objects.create(**revision_data, id='f4keh4sh1')
        revision.channels.set([channel1, channel2])
        revision.countries.set([country1, country2])
        revision.locales.set([locale1, locale2])
        revision.save()

        child_revision = RecipeRevision.objects.create(**revision_data, id='f4keh4sh2',
                                                       parent=revision)

        approval_request = ApprovalRequest.objects.create(
            revision=revision,
            approved=True,
        )

        recipe.latest_revision = child_revision
        recipe.approved_revision = revision
        recipe.save()

        assert RecipeRevision.objects.count() == 2

        # Apply the migrations
        apps_0005 = migrations.migrate('recipes', '0005_auto_20180503_2146')

        # Check that the temporary model no longer exists
        with pytest.raises(LookupError):
            apps_0005.get_model('recipes', 'TmpRecipeRevision')

        RecipeRevision = apps_0005.get_model('recipes', 'RecipeRevision')
        assert RecipeRevision.objects.count() == 2

        new_revision = RecipeRevision.objects.get(parent=None)

        assert isinstance(new_revision.id, int)

        # Check revision data
        for key in revision_data:
            value = revision_data[key]
            if hasattr(value, 'id'):
                assert getattr(new_revision, key).id == value.id
            else:
                assert getattr(new_revision, key) == revision_data[key]

        assert new_revision.countries.count() == 2
        assert new_revision.channels.count() == 2
        assert new_revision.locales.count() == 2
        assert new_revision.approval_request.id == approval_request.id

        recipe = new_revision.recipe
        assert recipe.latest_revision == new_revision.child
        assert recipe.approved_revision == new_revision

        # Check child revision data
        for key in revision_data:
            value = revision_data[key]
            if hasattr(value, 'id'):
                assert getattr(new_revision.child, key).id == value.id
            else:
                assert getattr(new_revision.child, key) == revision_data[key]

    def test_reverse(self, migrations):
        # Get the pre-migration models
        old_apps = migrations.migrate('recipes', '0005_auto_20180503_2146')
        Recipe = old_apps.get_model('recipes', 'Recipe')
        Action = old_apps.get_model('recipes', 'Action')
        RecipeRevision = old_apps.get_model('recipes', 'RecipeRevision')
        ApprovalRequest = old_apps.get_model('recipes', 'ApprovalRequest')
        Channel = old_apps.get_model('recipes', 'Channel')
        Country = old_apps.get_model('recipes', 'Country')
        Locale = old_apps.get_model('recipes', 'Locale')
        User = old_apps.get_model('auth', 'User')

        # Create test data
        recipe = Recipe.objects.create()
        action = Action.objects.create()
        channel1 = Channel.objects.create(slug='beta')
        channel2 = Channel.objects.create(slug='release')
        country1 = Country.objects.create(code='US')
        country2 = Country.objects.create(code='CA')
        locale1 = Locale.objects.create(code='en-US')
        locale2 = Locale.objects.create(code='fr-CA')
        user = User.objects.create(username='test')

        revision_data = {
            'recipe': recipe,
            'action': action,
            'user': user,
            'name': 'Test Revision',
            'identicon_seed': 'v1:test',
            'created': timezone.now(),
            'updated': timezone.now(),
            'comment': 'Test comment.',
            'arguments_json': '{"arg1": "val1"}',
            'extra_filter_expression': '1 == 1',
        }

        revision = RecipeRevision.objects.create(**revision_data)
        revision.channels.set([channel1, channel2])
        revision.countries.set([country1, country2])
        revision.locales.set([locale1, locale2])
        revision.save()

        child_revision = RecipeRevision.objects.create(**revision_data, parent=revision)

        approval_request = ApprovalRequest.objects.create(
            revision=revision,
            approved=True,
        )

        recipe.latest_revision = child_revision
        recipe.approved_revision = revision
        recipe.save()

        assert RecipeRevision.objects.count() == 2

        # Reverse the migrations
        apps_0002 = migrations.migrate('recipes', '0002_auto_20180406_1701')

        # Check that the temporary model no longer exists
        with pytest.raises(LookupError):
            apps_0002.get_model('recipes', 'TmpRecipeRevision')

        RecipeRevision = apps_0002.get_model('recipes', 'RecipeRevision')
        assert RecipeRevision.objects.count() == 2

        new_revision = RecipeRevision.objects.get(parent=None)

        assert isinstance(new_revision.id, str)
        assert new_revision.id == self._hash_revision(new_revision)

        # Check revision data
        for key in revision_data:
            value = revision_data[key]
            if hasattr(value, 'id'):
                assert getattr(new_revision, key).id == value.id
            else:
                assert getattr(new_revision, key) == revision_data[key]

        assert new_revision.countries.count() == 2
        assert new_revision.channels.count() == 2
        assert new_revision.locales.count() == 2
        assert new_revision.approval_request.id == approval_request.id

        recipe = new_revision.recipe
        assert recipe.latest_revision == new_revision.child
        assert recipe.approved_revision == new_revision

        # Check child revision data
        for key in revision_data:
            value = revision_data[key]
            if hasattr(value, 'id'):
                assert getattr(new_revision.child, key).id == value.id
            else:
                assert getattr(new_revision.child, key) == revision_data[key]

        assert new_revision.child.id == self._hash_revision(new_revision.child)
