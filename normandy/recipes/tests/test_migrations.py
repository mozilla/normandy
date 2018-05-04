import pytest

from django.utils import timezone


@pytest.mark.django_db
class Test0003Through0005(object):

    def test_forwards(self, migration):
        # Get the pre-migration models
        old_apps = migration.before('recipes', '0002_auto_20180406_1701')
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
        revision.channels = [channel1, channel2]
        revision.countries = [country1, country2]
        revision.locales = [locale1, locale2]
        revision.save()

        approval_request = ApprovalRequest.objects.create(
            revision=revision,
            approved=True,
        )

        recipe.latest_revision = revision
        recipe.approved_revision = revision
        recipe.save()

        assert RecipeRevision.objects.count() == 1

        # Apply the third migration
        apps_0005 = migration.apply('recipes', '0005_auto_20180503_2146')

        # Check that the temporary model no longer exists
        with pytest.raises(LookupError):
            apps_0005.get_model('recipes', 'TmpRecipeRevision')

        RecipeRevision = apps_0005.get_model('recipes', 'RecipeRevision')
        assert RecipeRevision.objects.count() == 1

        new_revision = RecipeRevision.objects.get()

        assert isinstance(new_revision.id, int)

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
        assert recipe.latest_revision == new_revision
        assert recipe.approved_revision == new_revision
