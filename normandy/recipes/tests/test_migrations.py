import hashlib
import json

import pytest

from django.utils import timezone

from normandy.base.tests import MigrationTest, Whatever


@pytest.mark.django_db
class Test0003Through0005(MigrationTest):
    def _get_filter_expression_for_revision(self, revision):
        parts = []

        if revision.locales.count():
            locales = ", ".join(["'{}'".format(l.code) for l in revision.locales.all()])
            parts.append("normandy.locale in [{}]".format(locales))

        if revision.countries.count():
            countries = ", ".join(["'{}'".format(c.code) for c in revision.countries.all()])
            parts.append("normandy.country in [{}]".format(countries))

        if revision.channels.count():
            channels = ", ".join(["'{}'".format(c.slug) for c in revision.channels.all()])
            parts.append("normandy.channel in [{}]".format(channels))

        if revision.extra_filter_expression:
            parts.append(revision.extra_filter_expression)

        expression = ") && (".join(parts)

        return "({})".format(expression) if len(parts) > 1 else expression

    def _hash_revision(self, revision):
        data = "{}{}{}{}{}{}".format(
            revision.recipe.id,
            revision.created,
            revision.name,
            revision.action.id,
            revision.arguments_json,
            self._get_filter_expression_for_revision(revision),
        )
        return hashlib.sha256(data.encode()).hexdigest()

    def test_forwards(self, migrations):
        # Get the pre-migration models
        old_apps = migrations.migrate("recipes", "0002_auto_20180406_1701")
        Recipe = old_apps.get_model("recipes", "Recipe")
        Action = old_apps.get_model("recipes", "Action")
        RecipeRevision = old_apps.get_model("recipes", "RecipeRevision")
        ApprovalRequest = old_apps.get_model("recipes", "ApprovalRequest")
        Channel = old_apps.get_model("recipes", "Channel")
        Country = old_apps.get_model("recipes", "Country")
        Locale = old_apps.get_model("recipes", "Locale")
        User = old_apps.get_model("auth", "User")

        # Create test data
        recipe = Recipe.objects.create()
        action = Action.objects.create()
        channel1 = Channel.objects.create(slug="beta")
        channel2 = Channel.objects.create(slug="release")
        country1 = Country.objects.create(code="US")
        country2 = Country.objects.create(code="CA")
        locale1 = Locale.objects.create(code="en-US")
        locale2 = Locale.objects.create(code="fr-CA")
        user = User.objects.create(username="test")

        revision_data = {
            "recipe": recipe,
            "action": action,
            "user": user,
            "name": "Test Revision",
            "identicon_seed": "v1:test",
            "created": timezone.now(),
            "updated": timezone.now(),
            "comment": "Test comment.",
            "arguments_json": '{"arg1": "val1"}',
            "extra_filter_expression": "1 == 1",
        }

        revision = RecipeRevision.objects.create(**revision_data, id="f4keh4sh1")
        revision.channels.set([channel1, channel2])
        revision.countries.set([country1, country2])
        revision.locales.set([locale1, locale2])
        revision.save()

        child_revision = RecipeRevision.objects.create(
            **revision_data, id="f4keh4sh2", parent=revision
        )

        approval_request = ApprovalRequest.objects.create(revision=revision, approved=True)

        recipe.latest_revision = child_revision
        recipe.approved_revision = revision
        recipe.save()

        assert RecipeRevision.objects.count() == 2

        # Apply the migrations
        apps_0005 = migrations.migrate("recipes", "0005_auto_20180503_2146")

        # Check that the temporary model no longer exists
        with pytest.raises(LookupError):
            apps_0005.get_model("recipes", "TmpRecipeRevision")

        RecipeRevision = apps_0005.get_model("recipes", "RecipeRevision")
        assert RecipeRevision.objects.count() == 2

        new_revision = RecipeRevision.objects.get(parent=None)

        assert isinstance(new_revision.id, int)

        # Check revision data
        for key in revision_data:
            value = revision_data[key]
            if hasattr(value, "id"):
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
            if hasattr(value, "id"):
                assert getattr(new_revision.child, key).id == value.id
            else:
                assert getattr(new_revision.child, key) == revision_data[key]

    def test_reverse(self, migrations):
        # Get the pre-migration models
        old_apps = migrations.migrate("recipes", "0005_auto_20180503_2146")
        Recipe = old_apps.get_model("recipes", "Recipe")
        Action = old_apps.get_model("recipes", "Action")
        RecipeRevision = old_apps.get_model("recipes", "RecipeRevision")
        ApprovalRequest = old_apps.get_model("recipes", "ApprovalRequest")
        Channel = old_apps.get_model("recipes", "Channel")
        Country = old_apps.get_model("recipes", "Country")
        Locale = old_apps.get_model("recipes", "Locale")
        User = old_apps.get_model("auth", "User")

        # Create test data
        recipe = Recipe.objects.create()
        action = Action.objects.create()
        channel1 = Channel.objects.create(slug="beta")
        channel2 = Channel.objects.create(slug="release")
        country1 = Country.objects.create(code="US")
        country2 = Country.objects.create(code="CA")
        locale1 = Locale.objects.create(code="en-US")
        locale2 = Locale.objects.create(code="fr-CA")
        user = User.objects.create(username="test")

        revision_data = {
            "recipe": recipe,
            "action": action,
            "user": user,
            "name": "Test Revision",
            "identicon_seed": "v1:test",
            "created": timezone.now(),
            "updated": timezone.now(),
            "comment": "Test comment.",
            "arguments_json": '{"arg1": "val1"}',
            "extra_filter_expression": "1 == 1",
        }

        revision = RecipeRevision.objects.create(**revision_data)
        revision.channels.set([channel1, channel2])
        revision.countries.set([country1, country2])
        revision.locales.set([locale1, locale2])
        revision.save()

        child_revision = RecipeRevision.objects.create(**revision_data, parent=revision)

        approval_request = ApprovalRequest.objects.create(revision=revision, approved=True)

        recipe.latest_revision = child_revision
        recipe.approved_revision = revision
        recipe.save()

        assert RecipeRevision.objects.count() == 2

        # Reverse the migrations
        apps_0002 = migrations.migrate("recipes", "0002_auto_20180406_1701")

        # Check that the temporary model no longer exists
        with pytest.raises(LookupError):
            apps_0002.get_model("recipes", "TmpRecipeRevision")

        RecipeRevision = apps_0002.get_model("recipes", "RecipeRevision")
        assert RecipeRevision.objects.count() == 2

        new_revision = RecipeRevision.objects.get(parent=None)

        assert isinstance(new_revision.id, str)
        assert new_revision.id == self._hash_revision(new_revision)

        # Check revision data
        for key in revision_data:
            value = revision_data[key]
            if hasattr(value, "id"):
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
            if hasattr(value, "id"):
                assert getattr(new_revision.child, key).id == value.id
            else:
                assert getattr(new_revision.child, key) == revision_data[key]

        assert new_revision.child.id == self._hash_revision(new_revision.child)


@pytest.mark.django_db
class Test0007FilterConversion(MigrationTest):
    def test_forwards(self, migrations):
        # Get the pre-migration models
        old_apps = migrations.migrate("recipes", "0006_reciperevision_filter_object_json")
        Recipe = old_apps.get_model("recipes", "Recipe")
        Action = old_apps.get_model("recipes", "Action")
        RecipeRevision = old_apps.get_model("recipes", "RecipeRevision")
        Channel = old_apps.get_model("recipes", "Channel")
        Country = old_apps.get_model("recipes", "Country")
        Locale = old_apps.get_model("recipes", "Locale")

        # Create test data
        recipe = Recipe.objects.create()
        action = Action.objects.create()
        channel1 = Channel.objects.create(slug="beta")
        channel2 = Channel.objects.create(slug="release")
        country1 = Country.objects.create(code="US")
        country2 = Country.objects.create(code="CA")
        locale1 = Locale.objects.create(code="en-US")
        locale2 = Locale.objects.create(code="fr-CA")

        revision = RecipeRevision.objects.create(
            recipe=recipe, action=action, name="Test Revision", identicon_seed="v1:test"
        )
        revision.channels.set([channel1, channel2])
        revision.countries.set([country1, country2])
        revision.locales.set([locale1, locale2])
        revision.save()

        # Apply the migration
        new_apps = migrations.migrate("recipes", "0007_convert_simple_filters_to_filter_objects")

        # Get the post-migration models
        RecipeRevision = new_apps.get_model("recipes", "RecipeRevision")

        # Fetch the revision
        revision = RecipeRevision.objects.get()
        revision.filter_object = json.loads(revision.filter_object_json)

        # All simple filters should be removed
        assert revision.channels.count() == 0
        assert revision.countries.count() == 0
        assert revision.locales.count() == 0

        # Order and duplication don't matter, so index the filter by type, and
        # compare the inner values using sets
        assert len(revision.filter_object) == 3
        filters_by_type = {f["type"]: f for f in revision.filter_object}
        assert filters_by_type["channel"] == {
            "type": "channel",
            "channels": Whatever(lambda v: set(v) == {channel1.slug, channel2.slug}),
        }
        assert filters_by_type["country"] == {
            "type": "country",
            "countries": Whatever(lambda v: set(v) == {country1.code, country2.code}),
        }
        assert filters_by_type["locale"] == {
            "type": "locale",
            "locales": Whatever(lambda v: set(v) == {locale1.code, locale2.code}),
        }

    def test_reverse(self, migrations):
        # Get the pre-migration models
        old_apps = migrations.migrate("recipes", "0007_convert_simple_filters_to_filter_objects")
        Recipe = old_apps.get_model("recipes", "Recipe")
        Action = old_apps.get_model("recipes", "Action")
        RecipeRevision = old_apps.get_model("recipes", "RecipeRevision")
        Channel = old_apps.get_model("recipes", "Channel")
        Country = old_apps.get_model("recipes", "Country")
        Locale = old_apps.get_model("recipes", "Locale")

        # Create test data
        recipe = Recipe.objects.create()
        action = Action.objects.create()
        channel1 = Channel.objects.create(slug="beta")
        channel2 = Channel.objects.create(slug="release")
        country1 = Country.objects.create(code="US")
        country2 = Country.objects.create(code="CA")
        locale1 = Locale.objects.create(code="en-US")
        locale2 = Locale.objects.create(code="fr-CA")

        revision = RecipeRevision.objects.create(
            recipe=recipe,
            action=action,
            name="Test Revision",
            identicon_seed="v1:test",
            filter_object_json=json.dumps(
                [
                    {"type": "locale", "locales": [locale1.code, locale2.code]},
                    {"type": "country", "countries": [country1.code, country2.code]},
                    {"type": "channel", "channels": [channel1.slug, channel2.slug]},
                ]
            ),
        )

        # Apply the migration
        new_apps = migrations.migrate("recipes", "0006_reciperevision_filter_object_json")

        # Get the post-migration models
        RecipeRevision = new_apps.get_model("recipes", "RecipeRevision")

        # Fetch the revision
        revision = RecipeRevision.objects.get()

        # Simple filters should be added
        assert revision.channels.count() == 2
        assert revision.countries.count() == 2
        assert revision.locales.count() == 2

        # Filter objects should be removed
        assert revision.filter_object_json is None

        # Order doesn't matter, so compare using sets
        assert set(c.slug for c in revision.channels.all()) == {channel1.slug, channel2.slug}
        assert set(c.code for c in revision.countries.all()) == {country1.code, country2.code}
        assert set(c.code for c in revision.locales.all()) == {locale1.code, locale2.code}


@pytest.mark.django_db
class Test0008Through0010(MigrationTest):
    def test_forwards(self, migrations):
        # Get the pre-migration models
        old_apps = migrations.migrate("recipes", "0007_convert_simple_filters_to_filter_objects")
        Recipe = old_apps.get_model("recipes", "Recipe")
        Action = old_apps.get_model("recipes", "Action")
        RecipeRevision = old_apps.get_model("recipes", "RecipeRevision")
        ApprovalRequest = old_apps.get_model("recipes", "ApprovalRequest")

        # Create the test data
        action = Action.objects.create()

        recipe1 = Recipe.objects.create(enabled=True)
        recipe2 = Recipe.objects.create(enabled=False)

        r1_revision1 = RecipeRevision.objects.create(
            recipe=recipe1,
            action=action,
            name="Test Revision (Approved)",
            identicon_seed="v1:test",
        )

        r1_revision2 = RecipeRevision.objects.create(
            recipe=recipe1, action=action, name="Test Revision", identicon_seed="v1:test"
        )

        ApprovalRequest.objects.create(revision=r1_revision1, approved=True)

        recipe1.latest_revision = r1_revision2
        recipe1.approved_revision = r1_revision1
        recipe1.save()

        r2_revision1 = RecipeRevision.objects.create(
            recipe=recipe2, action=action, name="Test Revision", identicon_seed="v1:test"
        )

        ApprovalRequest.objects.create(revision=r2_revision1, approved=True)

        recipe2.latest_revision = r2_revision1
        recipe2.approved_revision = r2_revision1
        recipe2.save()

        # Get the post-migration models
        new_apps = migrations.migrate("recipes", "0010_auto_20180510_2328")
        Recipe = new_apps.get_model("recipes", "Recipe")
        EnabledState = new_apps.get_model("recipes", "EnabledState")

        assert EnabledState.objects.count() == 1

        new_recipe1 = Recipe.objects.get(pk=recipe1.pk)
        assert new_recipe1.approved_revision.pk == r1_revision1.pk
        assert new_recipe1.approved_revision.enabled_state is not None
        assert new_recipe1.approved_revision.enabled_state.enabled is True

        new_recipe2 = Recipe.objects.get(pk=recipe2.pk)
        assert new_recipe2.approved_revision.pk == r2_revision1.pk
        assert new_recipe2.approved_revision.enabled_state is None

    def test_reverse(self, migrations):
        # Get the pre-migration models
        old_apps = migrations.migrate("recipes", "0010_auto_20180510_2328")
        Recipe = old_apps.get_model("recipes", "Recipe")
        Action = old_apps.get_model("recipes", "Action")
        RecipeRevision = old_apps.get_model("recipes", "RecipeRevision")
        ApprovalRequest = old_apps.get_model("recipes", "ApprovalRequest")
        EnabledState = old_apps.get_model("recipes", "EnabledState")

        # Create the test data
        action = Action.objects.create()

        recipe1 = Recipe.objects.create()
        recipe2 = Recipe.objects.create()

        r1_revision1 = RecipeRevision.objects.create(
            recipe=recipe1,
            action=action,
            name="Test Revision (Approved)",
            identicon_seed="v1:test",
        )

        r1_revision2 = RecipeRevision.objects.create(
            recipe=recipe1, action=action, name="Test Revision", identicon_seed="v1:test"
        )

        ApprovalRequest.objects.create(revision=r1_revision1, approved=True)

        r1_revision1.enabled_state = EnabledState.objects.create(
            revision=r1_revision1, enabled=True
        )
        r1_revision1.save()

        recipe1.latest_revision = r1_revision2
        recipe1.approved_revision = r1_revision1
        recipe1.save()

        r2_revision1 = RecipeRevision.objects.create(
            recipe=recipe2, action=action, name="Test Revision", identicon_seed="v1:test"
        )

        ApprovalRequest.objects.create(revision=r2_revision1, approved=True)

        r1_revision1.enabled_state = EnabledState.objects.create(
            revision=r1_revision1, enabled=True
        )
        r1_revision1.save()

        r2_revision2 = RecipeRevision.objects.create(
            recipe=recipe2, action=action, name="Test Revision II", identicon_seed="v1:test"
        )

        ApprovalRequest.objects.create(revision=r2_revision2, approved=True)

        EnabledState.objects.create(revision=r1_revision1, enabled=True)

        r2_revision2.enabled_state = EnabledState.objects.create(
            revision=r1_revision1, enabled=False
        )
        r2_revision2.save()

        recipe2.latest_revision = r2_revision1
        recipe2.approved_revision = r2_revision2
        recipe2.save()

        # Get the post-migration models
        new_apps = migrations.migrate("recipes", "0007_convert_simple_filters_to_filter_objects")
        Recipe = new_apps.get_model("recipes", "Recipe")

        new_recipe1 = Recipe.objects.get(pk=recipe1.pk)
        assert new_recipe1.enabled is True

        new_recipe2 = Recipe.objects.get(pk=recipe2.pk)
        assert new_recipe2.enabled is False
