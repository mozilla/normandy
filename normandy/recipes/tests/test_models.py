import hashlib
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured, ValidationError

import pytest
from rest_framework import serializers

from normandy.base.tests import UserFactory, Whatever
from normandy.recipes.models import (
    Action,
    ApprovalRequest,
    Client,
    EnabledState,
    INFO_CREATE_REVISION,
    INFO_REQUESTING_RECIPE_SIGNATURES,
    INFO_REQUESTING_ACTION_SIGNATURES,
    Recipe,
    RecipeRevision,
    WARNING_BYPASSING_PEER_APPROVAL,
)
from normandy.recipes.tests import (
    ActionFactory,
    ApprovalRequestFactory,
    ChannelFactory,
    CountryFactory,
    LocaleFactory,
    RecipeFactory,
    SignatureFactory,
)


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch('normandy.recipes.models.logger')


@pytest.mark.django_db
class TestAction(object):
    def test_recipes_used_by(self):
        approver = UserFactory()
        enabler = UserFactory()
        recipe = RecipeFactory(approver=approver, enabler=enabler)
        assert [recipe] == list(recipe.action.recipes_used_by)

        action = ActionFactory()
        recipes = RecipeFactory.create_batch(2, action=action, approver=approver, enabler=enabler)
        assert set(action.recipes_used_by) == set(recipes)

    def test_recipes_used_by_empty(self):
        assert list(ActionFactory().recipes_used_by) == []

        action = ActionFactory()
        RecipeFactory.create_batch(2, action=action)
        assert list(action.recipes_used_by) == []

    def test_update_signature(self, mocker, mock_logger):
        # Mock the Autographer
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.return_value = [
            {'signature': 'fake signature'},
        ]

        action = ActionFactory(signed=False)
        action.update_signature()
        mock_logger.info.assert_called_with(
            Whatever.contains(action.name),
            extra={'code': INFO_REQUESTING_ACTION_SIGNATURES, 'action_names': [action.name]}
        )

        action.save()
        assert action.signature is not None
        assert action.signature.signature == 'fake signature'

    def test_canonical_json(self):
        action = ActionFactory(name='test-action', implementation='console.log(true)')
        # Yes, this is ugly, but it needs to compare an exact byte
        # sequence, since this is used for hashing and signing
        expected = (
            '{'
            '"arguments_schema":{},'
            '"implementation_url":"/api/v1/action/test-action/implementation'
            '/sha384-ZRkmoh4lizeQ_jdtJBOQZmPzc3x09DKCA4gkdJmwEnO31F7Ttl8RyXkj3wG93lAP/",'
            '"name":"test-action"'
            '}'
        )
        expected = expected.encode()
        assert action.canonical_json() == expected

    def test_cant_change_signature_and_other_fields(self, mocker):
        # Mock the Autographer
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.return_value = [
            {'signature': 'fake signature'},
        ]
        action = ActionFactory(name='unchanged', signed=False)
        action.update_signature()
        action.name = 'changed'
        with pytest.raises(ValidationError) as exc_info:
            action.save()
        assert exc_info.value.message == 'Signatures must change alone'


@pytest.mark.django_db
class TestValidateArgumentPreferenceExperiments(object):
    """
    This tests methods on Action, usually by creating Recipe instances.
    """

    def test_it_works(self):
        action = ActionFactory(name='nothing special')
        # does not raise an exception
        action.validate_arguments({})

    def test_preference_experiments_no_errors(self):
        action = ActionFactory(name='preference-experiment')
        arguments = {
            'slug': 'a', 'branches': [
                {'slug': 'a', 'value': 'a'},
                {'slug': 'b', 'value': 'b'},
            ]
        }
        # does not throw when saving the revision
        RecipeFactory(action=action, arguments=arguments)

    def test_preference_exeriments_unique_branch_slugs(self):
        action = ActionFactory(name='preference-experiment')
        arguments = {
            'slug': 'test',
            'branches': [
                {'slug': 'unique', 'value': 'a'},
                {'slug': 'duplicate', 'value': 'b'},
                {'slug': 'duplicate', 'value': 'c'}
            ]
        }
        with pytest.raises(serializers.ValidationError) as exc_info:
            action.validate_arguments(arguments)
        error = action.errors['duplicate_branch_slug']
        assert exc_info.value.detail == {'arguments': {'branches': {2: {'slug': error}}}}

    def test_preference_exeriments_unique_branch_values(self):
        action = ActionFactory(name='preference-experiment')
        arguments = {
            'slug': 'test',
            'branches': [
                {'slug': 'a', 'value': 'unique'},
                {'slug': 'b', 'value': 'duplicate'},
                {'slug': 'c', 'value': 'duplicate'}
            ]
        }
        with pytest.raises(serializers.ValidationError) as exc_info:
            action.validate_arguments(arguments)
        error = action.errors['duplicate_branch_value']
        assert exc_info.value.detail == {'arguments': {'branches': {2: {'value': error}}}}

    def test_preference_experiments_unique_experiment_slug_no_collision(self):
        action = ActionFactory(name='preference-experiment')
        arguments_a = {'slug': 'a', 'branches': []}
        arguments_b = {'slug': 'b', 'branches': []}
        # Does not throw when saving revisions
        RecipeFactory(action=action, arguments=arguments_a)
        RecipeFactory(action=action, arguments=arguments_b)

    def test_preference_experiments_unique_experiment_slug_new_collision(self):
        action = ActionFactory(name='preference-experiment')
        arguments = {'slug': 'a', 'branches': []}
        RecipeFactory(action=action, arguments=arguments)

        with pytest.raises(serializers.ValidationError) as exc_info1:
            RecipeFactory(action=action, arguments=arguments)
        error = action.errors['duplicate_experiment_slug']
        assert exc_info1.value.detail == {'arguments': {'slug': error}}

    def test_preference_experiments_unique_experiment_slug_update_collision(self):
        action = ActionFactory(name='preference-experiment')
        arguments_a = {'slug': 'a', 'branches': []}
        arguments_b = {'slug': 'b', 'branches': []}
        # Does not throw when saving revisions
        RecipeFactory(action=action, arguments=arguments_a)
        recipe = RecipeFactory(action=action, arguments=arguments_b)

        with pytest.raises(serializers.ValidationError) as exc_info1:
            recipe.revise(arguments=arguments_a)
        error = action.errors['duplicate_experiment_slug']
        assert exc_info1.value.detail == {'arguments': {'slug': error}}


@pytest.mark.django_db
class TestRecipe(object):
    def test_enabled(self):
        """Test that the enabled property is correctly set."""
        r1 = RecipeFactory()
        assert r1.enabled is False

        r2 = RecipeFactory(approver=UserFactory())
        assert r2.enabled is False

        r3 = RecipeFactory(approver=UserFactory(), enabler=UserFactory())
        assert r3.enabled is True

    def test_revision_id_doesnt_change_if_no_changes(self):
        """
        revision_id should not increment if a recipe is saved with no
        changes.
        """
        recipe = RecipeFactory()

        # The factory saves a couple times so revision id is not 0
        revision_id = recipe.revision_id

        recipe.save()
        assert recipe.revision_id == revision_id

    def test_filter_expression(self):
        channel1 = ChannelFactory(slug='beta', name='Beta')
        channel2 = ChannelFactory(slug='release', name='Release')
        country1 = CountryFactory(code='US', name='USA')
        country2 = CountryFactory(code='CA', name='Canada')
        locale1 = LocaleFactory(code='en-US', name='English (US)')
        locale2 = LocaleFactory(code='fr-CA', name='French (CA)')

        r = RecipeFactory()
        assert r.filter_expression == ''

        r = RecipeFactory(channels=[channel1])
        assert r.filter_expression == "normandy.channel in ['beta']"

        r.revise(channels=[channel1, channel2])
        assert r.filter_expression == "normandy.channel in ['beta', 'release']"

        r = RecipeFactory(countries=[country1])
        assert r.filter_expression == "normandy.country in ['US']"

        r.revise(countries=[country1, country2])
        assert r.filter_expression == "normandy.country in ['CA', 'US']"

        r = RecipeFactory(locales=[locale1])
        assert r.filter_expression == "normandy.locale in ['en-US']"

        r.revise(locales=[locale1, locale2])
        assert r.filter_expression == "normandy.locale in ['en-US', 'fr-CA']"

        r = RecipeFactory(extra_filter_expression='2 + 2 == 4')
        assert r.filter_expression == '2 + 2 == 4'

        r.revise(channels=[channel1], countries=[country1], locales=[locale1])
        assert r.filter_expression == ("(normandy.locale in ['en-US']) && "
                                       "(normandy.country in ['US']) && "
                                       "(normandy.channel in ['beta']) && "
                                       "(2 + 2 == 4)")

    def test_canonical_json(self):
        recipe = RecipeFactory(
            action=ActionFactory(name='action'),
            arguments_json='{"foo": 1, "bar": 2}',
            channels=[ChannelFactory(slug='beta')],
            countries=[CountryFactory(code='CA')],
            extra_filter_expression='2 + 2 == 4',
            locales=[LocaleFactory(code='en-US')],
            name='canonical',
        )
        # Yes, this is really ugly, but we really do need to compare an exact
        # byte sequence, since this is used for hashing and signing
        filter_expression = (
            "(normandy.locale in ['en-US']) && (normandy.country in ['CA']) && "
            "(normandy.channel in ['beta']) && (2 + 2 == 4)"
        )
        expected = (
            '{'
            '"action":"action",'
            '"arguments":{"bar":2,"foo":1},'
            '"enabled":false,'
            '"filter_expression":"%(filter_expression)s",'
            '"id":%(id)s,'
            '"is_approved":false,'
            '"last_updated":"%(last_updated)s",'
            '"name":"canonical",'
            '"revision_id":"%(revision_id)s"'
            '}'
        ) % {
            'id': recipe.id,
            'revision_id': recipe.revision_id,
            'last_updated': recipe.last_updated.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            'filter_expression': filter_expression
        }
        expected = expected.encode()
        assert recipe.canonical_json() == expected

    def test_signature_is_correct_on_creation_if_autograph_available(self, mocked_autograph):
        recipe = RecipeFactory()
        expected_sig = hashlib.sha256(recipe.canonical_json()).hexdigest()
        assert recipe.signature.signature == expected_sig

    def test_signature_is_updated_if_autograph_available(self, mocked_autograph):
        recipe = RecipeFactory(name='unchanged')
        original_signature = recipe.signature
        assert original_signature is not None

        recipe.revise(name='changed')

        assert recipe.name == 'changed'
        assert recipe.signature is not original_signature
        expected_sig = hashlib.sha256(recipe.canonical_json()).hexdigest()
        assert recipe.signature.signature == expected_sig

    def test_signature_is_cleared_if_autograph_unavailable(self, mocker):
        # Mock the Autographer to return an error
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.side_effect = ImproperlyConfigured

        recipe = RecipeFactory(name='unchanged', signed=True)
        original_signature = recipe.signature
        recipe.revise(name='changed')
        assert recipe.name == 'changed'
        assert recipe.signature is not original_signature
        assert recipe.signature is None

    def test_setting_signature_doesnt_change_canonical_json(self):
        recipe = RecipeFactory(name='unchanged', signed=False)
        serialized = recipe.canonical_json()
        recipe.signature = SignatureFactory()
        recipe.save()
        assert recipe.signature is not None
        assert recipe.canonical_json() == serialized

    def test_cant_change_signature_and_other_fields(self):
        recipe = RecipeFactory(name='unchanged', signed=False)
        recipe.signature = SignatureFactory()
        with pytest.raises(ValidationError) as exc_info:
            recipe.revise(name='changed')
        assert exc_info.value.message == 'Signatures must change alone'

    def test_update_signature(self, mocker, mock_logger):
        # Mock the Autographer
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.return_value = [
            {'signature': 'fake signature'},
        ]

        recipe = RecipeFactory(signed=False)
        recipe.update_signature()
        mock_logger.info.assert_called_with(
            Whatever.contains(str(recipe.id)),
            extra={'code': INFO_REQUESTING_RECIPE_SIGNATURES, 'recipe_ids': [recipe.id]}
        )

        recipe.save()
        assert recipe.signature is not None
        assert recipe.signature.signature == 'fake signature'

    def test_signatures_update_correctly_on_enable(self, mocker):
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')

        def fake_sign(datas):
            sigs = []
            for d in datas:
                sigs.append({'signature': hashlib.sha256(d).hexdigest()})
            return sigs

        mock_autograph.return_value.sign_data.side_effect = fake_sign

        recipe = RecipeFactory(signed=False, approver=UserFactory())
        recipe.approved_revision.enable(user=UserFactory())
        recipe.refresh_from_db()

        assert recipe.signature is not None
        assert recipe.signature.signature == hashlib.sha256(recipe.canonical_json()).hexdigest()

    def test_recipe_revise_partial(self):
        a1 = ActionFactory()
        recipe = RecipeFactory(name='unchanged', action=a1, arguments={'message': 'something'},
                               extra_filter_expression='something !== undefined')
        a2 = ActionFactory()
        c = ChannelFactory(slug='beta')
        recipe.revise(name='changed', action=a2, channels=[c])
        assert recipe.action == a2
        assert recipe.name == 'changed'
        assert recipe.arguments == {'message': 'something'}
        assert recipe.filter_expression == ("(normandy.channel in ['beta']) && "
                                            "(something !== undefined)")

    def test_recipe_doesnt_revise_when_clean(self):
        channel = ChannelFactory()
        recipe = RecipeFactory(name='my name', channels=[channel])

        revision_id = recipe.revision_id
        last_updated = recipe.last_updated

        recipe.revise(name='my name', channels=[channel])
        assert revision_id == recipe.revision_id
        assert last_updated == recipe.last_updated

    def test_recipe_revise_channels(self):
        c1 = ChannelFactory(slug='beta')
        recipe = RecipeFactory(channels=[c1])

        c2 = ChannelFactory(slug='release')
        recipe.revise(channels=[c2])
        assert recipe.channels.count() == 1
        assert list(recipe.channels.all()) == [c2]

        recipe.revise(channels=[c1, c2])
        channels = list(recipe.channels.all())
        assert recipe.channels.count() == 2
        assert c1 in channels
        assert c2 in channels

        recipe.revise(channels=[])
        assert recipe.channels.count() == 0

    def test_recipe_revise_countries(self):
        c1 = CountryFactory(code='CA')
        recipe = RecipeFactory(countries=[c1])

        c2 = CountryFactory(code='US')
        recipe.revise(countries=[c2])
        assert recipe.countries.count() == 1
        assert list(recipe.countries.all()) == [c2]

        recipe.revise(countries=[c1, c2])
        countries = list(recipe.countries.all())
        assert recipe.countries.count() == 2
        assert c1 in countries
        assert c2 in countries

        recipe.revise(countries=[])
        assert recipe.countries.count() == 0

    def test_recipe_revise_locales(self):
        l1 = LocaleFactory(code='en-US')
        recipe = RecipeFactory(locales=[l1])

        l2 = LocaleFactory(code='fr-CA')
        recipe.revise(locales=[l2])
        assert recipe.locales.count() == 1
        assert list(recipe.locales.all()) == [l2]

        recipe.revise(locales=[l1, l2])
        locales = list(recipe.locales.all())
        assert recipe.locales.count() == 2
        assert l1 in locales
        assert l2 in locales

        recipe.revise(locales=[])
        assert recipe.locales.count() == 0

    def test_recipe_revise_arguments(self):
        recipe = RecipeFactory(arguments_json='{}')
        recipe.revise(arguments={'something': 'value'})
        assert recipe.arguments_json == '{"something": "value"}'

    def test_recipe_force_revise(self):
        recipe = RecipeFactory(name='my name')
        revision_id = recipe.revision_id
        recipe.revise(name='my name', force=True)
        assert revision_id != recipe.revision_id

    def test_update_logging(self, mock_logger):
        recipe = RecipeFactory(name='my name')
        recipe.revise(name='my name', force=True)
        mock_logger.info.assert_called_with(
            Whatever.contains(str(recipe.id)),
            extra={'code': INFO_CREATE_REVISION}
        )

    def test_revision_id_changes(self):
        """Ensure that the revision id is incremented on each save"""
        recipe = RecipeFactory()
        revision_id = recipe.revision_id
        recipe.revise(action=ActionFactory())
        assert recipe.revision_id != revision_id

    def test_current_revision_property(self):
        """Ensure current revision properties work as expected."""
        recipe = RecipeFactory(name='first')
        assert recipe.name == 'first'

        recipe.revise(name='second')
        assert recipe.name == 'second'

        approval = ApprovalRequestFactory(revision=recipe.latest_revision)
        approval.approve(UserFactory(), 'r+')
        assert recipe.name == 'second'

        # When `revise` is called on a recipe with at least one approved revision, the new revision
        # is treated as a draft and as such the `name` property of the recipe should return the
        # `name` from the `approved_revision` not the `latest_revision`.
        recipe.revise(name='third')
        assert recipe.latest_revision.name == 'third'  # The latest revision ("draft") is updated
        assert recipe.name == 'second'  # The current revision is unchanged

    def test_recipe_is_approved(self):
        recipe = RecipeFactory(name='old')
        assert not recipe.is_approved

        approval = ApprovalRequestFactory(revision=recipe.latest_revision)
        approval.approve(UserFactory(), 'r+')
        assert recipe.is_approved
        assert recipe.approved_revision == recipe.latest_revision

        recipe.revise(name='new')
        assert recipe.is_approved
        assert recipe.approved_revision != recipe.latest_revision

    def test_delete_pending_approval_request_on_revise(self):
        recipe = RecipeFactory(name='old')
        approval = ApprovalRequestFactory(revision=recipe.latest_revision)
        recipe.revise(name='new')

        with pytest.raises(ApprovalRequest.DoesNotExist):
            ApprovalRequest.objects.get(pk=approval.pk)

    def test_approval_request_property(self):
        # Make sure it works when there is no approval request
        recipe = RecipeFactory(name='old')
        assert recipe.approval_request is None

        # Make sure it returns an approval request if it exists
        approval = ApprovalRequestFactory(revision=recipe.latest_revision)
        assert recipe.approval_request == approval

        # Check the edge case where there is no latest_revision
        recipe.latest_revision.delete()
        recipe.refresh_from_db()
        assert recipe.approval_request is None

    def test_revise_arguments(self):
        recipe = RecipeFactory(arguments_json='[]')
        recipe.revise(arguments=[{'id': 1}])
        assert recipe.arguments_json == '[{"id": 1}]'


@pytest.mark.django_db
class TestRecipeRevision(object):
    def test_approval_status(self):
        recipe = RecipeFactory()
        revision = recipe.latest_revision
        assert revision.approval_status is None

        approval = ApprovalRequestFactory(revision=revision)
        revision = RecipeRevision.objects.get(pk=revision.pk)
        assert revision.approval_status == revision.PENDING

        approval.approve(UserFactory(), 'r+')
        revision = RecipeRevision.objects.get(pk=revision.pk)
        assert revision.approval_status == revision.APPROVED

        approval.delete()
        approval = ApprovalRequestFactory(revision=revision)
        approval.reject(UserFactory(), 'r-')
        revision = RecipeRevision.objects.get(pk=revision.pk)
        assert revision.approval_status == revision.REJECTED

    def test_enable(self):
        recipe = RecipeFactory(name='Test')
        with pytest.raises(EnabledState.NotActionable):
            recipe.latest_revision.enable(user=UserFactory())

        approval_request = recipe.latest_revision.request_approval(creator=UserFactory())
        approval_request.approve(approver=UserFactory(), comment='r+')

        recipe.revise(name='New name')
        with pytest.raises(EnabledState.NotActionable):
            recipe.latest_revision.enable(user=UserFactory())

        recipe.approved_revision.enable(user=UserFactory())
        assert recipe.enabled

        with pytest.raises(EnabledState.NotActionable):
            recipe.approved_revision.enable(user=UserFactory())

        approval_request = recipe.latest_revision.request_approval(creator=UserFactory())
        approval_request.approve(approver=UserFactory(), comment='r+')
        assert not recipe.enabled

        recipe.approved_revision.enable(user=UserFactory())
        assert recipe.enabled

    def test_disable(self):
        recipe = RecipeFactory(name='Test', approver=UserFactory(), enabler=UserFactory())
        assert recipe.enabled

        recipe.approved_revision.disable(user=UserFactory())
        assert not recipe.enabled

        with pytest.raises(EnabledState.NotActionable):
            recipe.approved_revision.disable(user=UserFactory())

        recipe.revise(name='New name')

        with pytest.raises(EnabledState.NotActionable):
            recipe.latest_revision.disable(user=UserFactory())


@pytest.mark.django_db
class TestApprovalRequest(object):
    def test_approve(self, mocker):
        u = UserFactory()
        req = ApprovalRequestFactory()
        mocker.patch.object(req, 'verify_approver')

        req.approve(u, 'r+')
        assert req.approved
        assert req.approver == u
        assert req.comment == 'r+'
        req.verify_approver.assert_called_with(u)

        recipe = req.revision.recipe
        assert recipe.is_approved

    def test_cannot_approve_already_approved(self):
        u = UserFactory()
        req = ApprovalRequestFactory()
        req.approve(u, 'r+')

        with pytest.raises(req.NotActionable):
            req.approve(u, 'r+')

    def test_reject(self, mocker):
        u = UserFactory()
        req = ApprovalRequestFactory()
        mocker.patch.object(req, 'verify_approver')

        req.reject(u, 'r-')
        assert not req.approved
        assert req.approver == u
        assert req.comment == 'r-'
        req.verify_approver.assert_called_with(u)

        recipe = req.revision.recipe
        assert not recipe.is_approved

    def test_cannot_reject_already_rejected(self):
        u = UserFactory()
        req = ApprovalRequestFactory()
        req.reject(u, 'r-')

        with pytest.raises(req.NotActionable):
            req.reject(u, 'r-')

    def test_verify_approver_enforced(self, settings, mocker):
        settings.PEER_APPROVAL_ENFORCED = True

        creator = UserFactory()
        user = UserFactory()
        req = ApprovalRequestFactory(creator=creator)

        # Do not raise when creator and approver are different
        req.verify_approver(user)

        # Raise when creator and approver are the same
        with pytest.raises(req.CannotActOnOwnRequest):
            req.verify_approver(creator)

    def test_verify_approver_unenforced(self, settings, mocker):
        logger = mocker.patch('normandy.recipes.models.logger')
        settings.PEER_APPROVAL_ENFORCED = False

        creator = UserFactory()
        user = UserFactory()
        req = ApprovalRequestFactory(creator=creator)

        # Do not raise when creator and approver are different
        req.verify_approver(user)

        # Do not raise when creator and approver are the same since enforcement
        # is disabled.
        req.verify_approver(creator)
        logger.warning.assert_called_with(Whatever(), extra={
            'code': WARNING_BYPASSING_PEER_APPROVAL,
            'approval_id': req.id,
            'approver': creator,
        })


@pytest.mark.django_db
class TestRecipeQueryset(object):
    def test_update_signatures(self, mocker, mock_logger):
        # Make sure the test environment is clean. This test is invalid otherwise.
        assert Recipe.objects.all().count() == 0

        # Mock the Autographer
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.return_value = [
            {'signature': 'fake signature 1'},
            {'signature': 'fake signature 2'},
        ]

        # Make and sign two recipes
        (recipe1, recipe2) = RecipeFactory.create_batch(2)
        Recipe.objects.all().update_signatures()

        # Assert that the signature update is logged.
        mock_logger.info.assert_called_with(
            Whatever.contains(str(recipe1.id), str(recipe2.id)),
            extra={
                'code': INFO_REQUESTING_RECIPE_SIGNATURES,
                'recipe_ids': Whatever.contains(recipe1.id, recipe2.id)
            }
        )

        # Assert the autographer was used as expected
        assert mock_autograph.called
        assert mock_autograph.return_value.sign_data.called_with([Whatever(), Whatever()])
        signatures = list(Recipe.objects.all().values_list('signature__signature', flat=True))
        assert signatures == ['fake signature 1', 'fake signature 2']


@pytest.mark.django_db
class TestActionQueryset(object):
    def test_update_signatures(self, mocker, mock_logger):
        # Make sure the test environment is clean. This test is invalid otherwise.
        assert Action.objects.all().count() == 0

        # Mock the Autographer
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.return_value = [
            {'signature': 'fake signature 1'},
            {'signature': 'fake signature 2'},
        ]

        # Make and sign two actions
        (action1, action2) = ActionFactory.create_batch(2)
        Action.objects.all().update_signatures()

        # Assert that the signature update is logged.
        mock_logger.info.assert_called_with(
            Whatever.contains(action1.name, action2.name),
            extra={
                'code': INFO_REQUESTING_ACTION_SIGNATURES,
                'action_names': Whatever.contains(action1.name, action2.name),
            }
        )

        # Assert the autographer was used as expected
        assert mock_autograph.called
        assert mock_autograph.return_value.sign_data.called_with([Whatever(), Whatever()])
        signatures = list(Action.objects.all().values_list('signature__signature', flat=True))
        assert signatures == ['fake signature 1', 'fake signature 2']


class TestClient(object):
    def test_geolocation(self, rf, settings):
        settings.NUM_PROXIES = 1
        req = rf.post('/', X_FORWARDED_FOR='fake, 1.1.1.1', REMOTE_ADDR='2.2.2.2')
        client = Client(req)

        with patch('normandy.recipes.models.get_country_code') as get_country_code:
            assert client.country == get_country_code.return_value
            assert get_country_code.called_with('1.1.1.1')

    def test_initial_values(self, rf):
        """Ensure that computed properties can be overridden."""
        req = rf.post('/', X_FORWARDED_FOR='fake, 1.1.1.1', REMOTE_ADDR='2.2.2.2')
        client = Client(req, country='FAKE', request_time='FAKE')
        assert client.country == 'FAKE'
        assert client.request_time == 'FAKE'
