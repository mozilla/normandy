import json
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured, ValidationError

import pytest
from rest_framework import serializers
from kinto_http import exceptions as remote_settings_exceptions

from normandy.base.tests import UserFactory, Whatever
from normandy.recipes.models import (
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
    RecipeFactory,
    RecipeRevisionFactory,
    SignatureFactory,
    fake_sign,
)


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch("normandy.recipes.models.logger")


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
        mock_autograph = mocker.patch("normandy.recipes.models.Autographer")
        mock_autograph.return_value.sign_data.return_value = [{"signature": "fake signature"}]

        action = ActionFactory(signed=False)
        action.update_signature()
        mock_logger.info.assert_called_with(
            Whatever.contains(action.name),
            extra={"code": INFO_REQUESTING_ACTION_SIGNATURES, "action_names": [action.name]},
        )

        action.save()
        assert action.signature is not None
        assert action.signature.signature == "fake signature"

    def test_canonical_json(self):
        action = ActionFactory(name="test-action", implementation="console.log(true)")
        # Yes, this is ugly, but it needs to compare an exact byte
        # sequence, since this is used for hashing and signing
        expected = (
            "{"
            '"arguments_schema":{},'
            '"implementation_url":"/api/v1/action/test-action/implementation'
            '/sha384-ZRkmoh4lizeQ_jdtJBOQZmPzc3x09DKCA4gkdJmwEnO31F7Ttl8RyXkj3wG93lAP/",'
            '"name":"test-action"'
            "}"
        )
        expected = expected.encode()
        assert action.canonical_json() == expected

    def test_cant_change_signature_and_other_fields(self, mocker):
        # Mock the Autographer
        mock_autograph = mocker.patch("normandy.recipes.models.Autographer")
        mock_autograph.return_value.sign_data.return_value = [{"signature": "fake signature"}]
        action = ActionFactory(name="unchanged", signed=False)
        action.update_signature()
        action.name = "changed"
        with pytest.raises(ValidationError) as exc_info:
            action.save()
        assert exc_info.value.message == "Signatures must change alone"


@pytest.mark.django_db
class TestValidateArgumentPreferenceExperiments(object):
    """
    This tests methods on Action, usually by creating Recipe instances.
    """

    def test_it_works(self):
        action = ActionFactory(name="nothing special")
        # does not raise an exception
        action.validate_arguments({}, RecipeRevisionFactory())

    @pytest.mark.django_db
    class TestPreferenceExperiments(object):
        def test_no_errors(self):
            action = ActionFactory(name="preference-experiment")
            arguments = {
                "slug": "a",
                "branches": [{"slug": "a", "value": "a"}, {"slug": "b", "value": "b"}],
            }
            # does not throw when saving the revision
            recipe = RecipeFactory(action=action, arguments=arguments)

            # Approve and enable the revision
            rev = recipe.latest_revision
            approval_request = rev.request_approval(UserFactory())
            approval_request.approve(UserFactory(), "r+")
            rev.enable(UserFactory())

        def test_preference_exeriments_unique_branch_slugs(self):
            action = ActionFactory(name="preference-experiment")
            arguments = {
                "slug": "test",
                "branches": [
                    {"slug": "unique", "value": "a"},
                    {"slug": "duplicate", "value": "b"},
                    {"slug": "duplicate", "value": "c"},
                ],
            }
            with pytest.raises(serializers.ValidationError) as exc_info:
                action.validate_arguments(arguments, RecipeRevisionFactory())
            error = action.errors["duplicate_branch_slug"]
            assert exc_info.value.detail == {"arguments": {"branches": {2: {"slug": error}}}}

        def test_preference_exeriments_unique_branch_values(self):
            action = ActionFactory(name="preference-experiment")
            arguments = {
                "slug": "test",
                "branches": [
                    {"slug": "a", "value": "unique"},
                    {"slug": "b", "value": "duplicate"},
                    {"slug": "c", "value": "duplicate"},
                ],
            }
            with pytest.raises(serializers.ValidationError) as exc_info:
                action.validate_arguments(arguments, RecipeRevisionFactory())
            error = action.errors["duplicate_branch_value"]
            assert exc_info.value.detail == {"arguments": {"branches": {2: {"value": error}}}}

        def test_unique_experiment_slug_no_collision(self):
            action = ActionFactory(name="preference-experiment")
            arguments_a = {"slug": "a", "branches": []}
            arguments_b = {"slug": "b", "branches": []}
            # Does not throw when saving revisions
            RecipeFactory(action=action, arguments=arguments_a)
            RecipeFactory(action=action, arguments=arguments_b)

        def test_unique_experiment_slug_new_collision(self):
            action = ActionFactory(name="preference-experiment")
            arguments = {"slug": "a", "branches": []}
            RecipeFactory(action=action, arguments=arguments)

            with pytest.raises(serializers.ValidationError) as exc_info1:
                RecipeFactory(action=action, arguments=arguments)
            error = action.errors["duplicate_experiment_slug"]
            assert exc_info1.value.detail == {"arguments": {"slug": error}}

        def test_unique_experiment_slug_update_collision(self):
            action = ActionFactory(name="preference-experiment")
            arguments_a = {"slug": "a", "branches": []}
            arguments_b = {"slug": "b", "branches": []}
            # Does not throw when saving revisions
            RecipeFactory(action=action, arguments=arguments_a)
            recipe = RecipeFactory(action=action, arguments=arguments_b)

            with pytest.raises(serializers.ValidationError) as exc_info1:
                recipe.revise(arguments=arguments_a)
            error = action.errors["duplicate_experiment_slug"]
            assert exc_info1.value.detail == {"arguments": {"slug": error}}

    @pytest.mark.django_db
    class TestPreferenceRollout(object):
        def test_no_errors(self):
            action = ActionFactory(name="preference-rollout")
            arguments = {
                "slug": "test-rollout",
                "preferences": [{"preferenceName": "foo", "value": 5}],
            }
            # does not throw when saving the revision
            recipe = RecipeFactory(action=action, arguments=arguments)

            # Approve and enable the revision
            rev = recipe.latest_revision
            approval_request = rev.request_approval(UserFactory())
            approval_request.approve(UserFactory(), "r+")
            rev.enable(UserFactory())

        def test_no_duplicates(self):
            action = ActionFactory(name="preference-rollout")
            arguments_a = {"slug": "a", "preferences": [{"preferenceName": "a", "value": "a"}]}
            arguments_b = {"slug": "b", "preferences": [{"preferenceName": "b", "value": "b"}]}
            RecipeFactory(action=action, arguments=arguments_a)
            recipe_b = RecipeFactory(action=action, arguments=arguments_b)
            expected_error = action.errors["duplicate_rollout_slug"]

            # Creating a new recipe fails
            with pytest.raises(serializers.ValidationError) as exc_info1:
                RecipeFactory(action=action, arguments=arguments_a)
            assert exc_info1.value.detail == {"arguments": {"slug": expected_error}}

            # Revising an existing recipe fails
            with pytest.raises(serializers.ValidationError) as exc_info2:
                recipe_b.revise(arguments=arguments_a)
            assert exc_info2.value.detail == {"arguments": {"slug": expected_error}}

    @pytest.mark.django_db
    class TestPreferenceRollback(object):
        def test_no_errors(self):
            rollback_action = ActionFactory(name="preference-rollback")
            rollout_action = ActionFactory(name="preference-rollout")
            rollout_recipe = RecipeFactory(
                action=rollout_action, arguments={"slug": "test-rollout"}
            )

            # does not throw when saving the revision
            arguments = {"rolloutSlug": rollout_recipe.arguments["slug"]}
            RecipeFactory(action=rollback_action, arguments=arguments)

        def test_slug_must_match_a_rollout(self):
            rollback_action = ActionFactory(name="preference-rollback")
            arguments = {"rolloutSlug": "does-not-exist"}
            with pytest.raises(serializers.ValidationError) as exc_info:
                RecipeFactory(action=rollback_action, arguments=arguments)
            error = rollback_action.errors["rollout_slug_not_found"]
            assert exc_info.value.detail == {"arguments": {"slug": error}}

    @pytest.mark.django_db
    class TestOptOutStudy(object):
        def test_no_errors(self):
            action = ActionFactory(name="opt-out-study")
            arguments = {"name": "foo"}
            recipe = RecipeFactory(action=action, arguments=arguments)

            # Approve and enable the revision
            rev = recipe.latest_revision
            approval_request = rev.request_approval(UserFactory())
            approval_request.approve(UserFactory(), "r+")
            rev.enable(UserFactory())

        def test_unique_name_new_collision(self):
            action = ActionFactory(name="opt-out-study")
            arguments = {"name": "foo"}
            RecipeFactory(action=action, arguments=arguments)

            with pytest.raises(serializers.ValidationError) as exc_info1:
                RecipeFactory(action=action, arguments=arguments)
            error = action.errors["duplicate_study_name"]
            assert exc_info1.value.detail == {"arguments": {"name": error}}

        def test_unique_name_update_collision(self):
            action = ActionFactory(name="opt-out-study")
            arguments_a = {"name": "foo"}
            arguments_b = {"name": "bar"}
            RecipeFactory(action=action, arguments=arguments_a)
            recipe = RecipeFactory(action=action, arguments=arguments_b)

            with pytest.raises(serializers.ValidationError) as exc_info1:
                recipe.revise(arguments=arguments_a)
            error = action.errors["duplicate_study_name"]
            assert exc_info1.value.detail == {"arguments": {"name": error}}


@pytest.mark.django_db
class TestValidateArgumentShowHeartbeat(object):
    """
    This tests methods on Action, usually by creating Recipe instances.
    """

    def test_no_errors(self):
        action = ActionFactory(name="show-heartbeat")
        arguments = {
            "repeatOption": "nag",
            "surveyId": "001",
            "message": "Message!",
            "learnMoreMessage": "More!?!",
            "learnMoreUrl": "https://example.com/learnmore",
            "engagementButtonLabel": "Label!",
            "thanksMessage": "Thanks!",
            "postAnswerUrl": "https://example.com/answer",
            "includeTelemetryUUID": True,
        }
        # does not throw when saving the revision
        recipe = RecipeFactory(action=action, arguments=arguments)

        # Approve and enable the revision
        rev = recipe.latest_revision
        approval_request = rev.request_approval(UserFactory())
        approval_request.approve(UserFactory(), "r+")
        rev.enable(UserFactory())
        assert rev.arguments["surveyId"] == "001"

    def test_no_error_distinctly_different_survey_ids(self):
        action = ActionFactory(name="show-heartbeat")
        arguments = {
            "repeatOption": "nag",
            "surveyId": "001",
            "message": "Message!",
            "learnMoreMessage": "More!?!",
            "learnMoreUrl": "https://example.com/learnmore",
            "engagementButtonLabel": "Label!",
            "thanksMessage": "Thanks!",
            "postAnswerUrl": "https://example.com/answer",
            "includeTelemetryUUID": True,
        }
        # does not throw when saving the revision
        recipe = RecipeFactory(action=action, arguments=arguments)

        # Approve and enable the revision
        rev = recipe.latest_revision
        approval_request = rev.request_approval(UserFactory())
        approval_request.approve(UserFactory(), "r+")
        rev.enable(UserFactory())
        assert rev.arguments["surveyId"] == "001"

        arguments["surveyId"] = "002"
        recipe = RecipeFactory(action=action, arguments=arguments)
        rev = recipe.latest_revision
        assert rev.arguments["surveyId"] == "002"

    def test_repeated_identical_survey_ids(self):
        action = ActionFactory(name="show-heartbeat")
        arguments = {
            "repeatOption": "nag",
            "surveyId": "001",
            "message": "Message!",
            "learnMoreMessage": "More!?!",
            "learnMoreUrl": "https://example.com/learnmore",
            "engagementButtonLabel": "Label!",
            "thanksMessage": "Thanks!",
            "postAnswerUrl": "https://example.com/answer",
            "includeTelemetryUUID": True,
        }
        RecipeFactory(action=action, arguments=arguments)
        # Reusing the same "surveyId" should cause a ValidationError.
        # But you can change other things.
        arguments["message"] += " And this!"
        with pytest.raises(serializers.ValidationError) as exc_info:
            RecipeFactory(action=action, arguments=arguments)
        expected_error = action.errors["duplicate_survey_id"]
        assert exc_info.value.detail == {"arguments": {"surveyId": expected_error}}


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
        r = RecipeFactory(extra_filter_expression="", filter_object_json=None)
        assert r.filter_expression == ""

        r = RecipeFactory(extra_filter_expression="2 + 2 == 4", filter_object_json=None)
        assert r.filter_expression == "2 + 2 == 4"

    def test_canonical_json(self):
        recipe = RecipeFactory(
            action=ActionFactory(name="action"),
            arguments_json='{"foo": 1, "bar": 2}',
            extra_filter_expression="2 + 2 == 4",
            name="canonical",
            filter_object_json=None,
        )
        # Yes, this is really ugly, but we really do need to compare an exact
        # byte sequence, since this is used for hashing and signing
        filter_expression = "2 + 2 == 4"
        expected = (
            "{"
            '"action":"action",'
            '"arguments":{"bar":2,"foo":1},'
            '"filter_expression":"%(filter_expression)s",'
            '"id":%(id)s,'
            '"name":"canonical",'
            '"revision_id":"%(revision_id)s"'
            "}"
        ) % {
            "id": recipe.id,
            "revision_id": recipe.revision_id,
            "filter_expression": filter_expression,
        }
        expected = expected.encode()
        assert recipe.canonical_json() == expected

    def test_signature_is_correct_on_creation_if_autograph_available(self, mocked_autograph):
        recipe = RecipeFactory(approver=UserFactory(), enabler=UserFactory())
        expected_sig = fake_sign([recipe.canonical_json()])[0]["signature"]
        assert recipe.signature.signature == expected_sig

    def test_signature_is_updated_if_autograph_available(self, mocked_autograph):
        recipe = RecipeFactory(name="unchanged", approver=UserFactory(), enabler=UserFactory())
        original_signature = recipe.signature
        assert original_signature is not None

        recipe.revise(name="changed")

        assert recipe.latest_revision.name == "changed"
        assert recipe.signature is not original_signature
        expected_sig = fake_sign([recipe.canonical_json()])[0]["signature"]
        assert recipe.signature.signature == expected_sig

    def test_signature_is_cleared_if_autograph_unavailable(self, mocker):
        # Mock the Autographer to return an error
        mock_autograph = mocker.patch("normandy.recipes.models.Autographer")
        mock_autograph.side_effect = ImproperlyConfigured

        recipe = RecipeFactory(name="unchanged", signed=True)
        original_signature = recipe.signature
        recipe.revise(name="changed")
        assert recipe.name == "changed"
        assert recipe.signature is not original_signature
        assert recipe.signature is None

    def test_setting_signature_doesnt_change_canonical_json(self):
        recipe = RecipeFactory(name="unchanged", signed=False)
        serialized = recipe.canonical_json()
        recipe.signature = SignatureFactory()
        recipe.save()
        assert recipe.signature is not None
        assert recipe.canonical_json() == serialized

    def test_cant_change_signature_and_other_fields(self):
        recipe = RecipeFactory(name="unchanged", signed=False)
        recipe.signature = SignatureFactory()
        with pytest.raises(ValidationError) as exc_info:
            recipe.revise(name="changed")
        assert exc_info.value.message == "Signatures must change alone"

    def test_update_signature(self, mock_logger, mocked_autograph):
        recipe = RecipeFactory(enabler=UserFactory(), approver=UserFactory())
        recipe.signature = None
        recipe.update_signature()
        mock_logger.info.assert_called_with(
            Whatever.contains(str(recipe.id)),
            extra={"code": INFO_REQUESTING_RECIPE_SIGNATURES, "recipe_ids": [recipe.id]},
        )
        mocked_autograph.return_value.sign_data.assert_called_with(
            [Whatever(lambda s: json.loads(s)["id"] == recipe.id)]
        )
        assert recipe.signature is not None

    def test_signatures_update_correctly_on_enable(self, mocked_autograph):
        recipe = RecipeFactory(signed=False, approver=UserFactory())
        recipe.approved_revision.enable(user=UserFactory())
        recipe.refresh_from_db()

        assert recipe.signature is not None
        assert recipe.signature.signature == fake_sign([recipe.canonical_json()])[0]["signature"]

    def test_only_signed_when_approved_and_enabled(self, mocked_autograph):
        sign_data_mock = mocked_autograph.return_value.sign_data
        # This uses the signer, so do it first
        action = ActionFactory()
        sign_data_mock.reset_mock()

        sign_data_mock.side_effect = Exception("Can't sign yet")
        recipe = RecipeFactory(name="unchanged", action=action)
        assert not recipe.enabled
        assert not recipe.is_approved
        assert recipe.signature is None

        # Updating does not generate a signature
        recipe.revise(name="changed")
        assert recipe.signature is None

        # Approving does not sign the recipe
        rev = recipe.latest_revision
        approval_request = rev.request_approval(UserFactory())
        approval_request.approve(UserFactory(), "r+")
        recipe.refresh_from_db()
        assert recipe.signature is None
        mocked_autograph.return_value.sign_data.assert_not_called()

        # Enabling signs the recipe
        mocked_autograph.return_value.sign_data.side_effect = fake_sign
        rev.enable(UserFactory())
        recipe.refresh_from_db()
        expected_sig = fake_sign([recipe.canonical_json()])[0]["signature"]
        assert recipe.signature.signature == expected_sig
        assert mocked_autograph.return_value.sign_data.called_once()

    def test_recipe_revise_partial(self):
        a1 = ActionFactory()
        recipe = RecipeFactory(
            name="unchanged",
            action=a1,
            arguments={"message": "something"},
            extra_filter_expression="something !== undefined",
            filter_object_json=None,
        )
        a2 = ActionFactory()
        recipe.revise(name="changed", action=a2)
        assert recipe.action == a2
        assert recipe.name == "changed"
        assert recipe.arguments == {"message": "something"}
        assert recipe.filter_expression == "something !== undefined"

    def test_recipe_doesnt_revise_when_clean(self):
        recipe = RecipeFactory(name="my name")

        revision_id = recipe.revision_id
        last_updated = recipe.last_updated

        recipe.revise(name="my name")
        assert revision_id == recipe.revision_id
        assert last_updated == recipe.last_updated

    def test_recipe_revise_arguments(self):
        recipe = RecipeFactory(arguments_json="{}")
        recipe.revise(arguments={"something": "value"})
        assert recipe.arguments_json == '{"something": "value"}'

    def test_recipe_force_revise(self):
        recipe = RecipeFactory(name="my name")
        revision_id = recipe.revision_id
        recipe.revise(name="my name", force=True)
        assert revision_id != recipe.revision_id

    def test_update_logging(self, mock_logger):
        recipe = RecipeFactory(name="my name")
        recipe.revise(name="my name", force=True)
        mock_logger.info.assert_called_with(
            Whatever.contains(str(recipe.id)), extra={"code": INFO_CREATE_REVISION}
        )

    def test_revision_id_changes(self):
        """Ensure that the revision id is incremented on each save"""
        recipe = RecipeFactory()
        revision_id = recipe.revision_id
        recipe.revise(action=ActionFactory())
        assert recipe.revision_id != revision_id

    def test_current_revision_property(self):
        """Ensure current revision properties work as expected."""
        recipe = RecipeFactory(name="first")
        assert recipe.name == "first"

        recipe.revise(name="second")
        assert recipe.name == "second"

        approval = ApprovalRequestFactory(revision=recipe.latest_revision)
        approval.approve(UserFactory(), "r+")
        assert recipe.name == "second"

        # When `revise` is called on a recipe with at least one approved revision, the new revision
        # is treated as a draft and as such the `name` property of the recipe should return the
        # `name` from the `approved_revision` not the `latest_revision`.
        recipe.revise(name="third")
        assert recipe.latest_revision.name == "third"  # The latest revision ("draft") is updated
        assert recipe.name == "second"  # The current revision is unchanged

    def test_recipe_is_approved(self):
        recipe = RecipeFactory(name="old")
        assert not recipe.is_approved

        approval = ApprovalRequestFactory(revision=recipe.latest_revision)
        approval.approve(UserFactory(), "r+")
        assert recipe.is_approved
        assert recipe.approved_revision == recipe.latest_revision

        recipe.revise(name="new")
        assert recipe.is_approved
        assert recipe.approved_revision != recipe.latest_revision

    def test_delete_pending_approval_request_on_revise(self):
        recipe = RecipeFactory(name="old")
        approval = ApprovalRequestFactory(revision=recipe.latest_revision)
        recipe.revise(name="new")

        with pytest.raises(ApprovalRequest.DoesNotExist):
            ApprovalRequest.objects.get(pk=approval.pk)

    def test_approval_request_property(self):
        # Make sure it works when there is no approval request
        recipe = RecipeFactory(name="old")
        assert recipe.approval_request is None

        # Make sure it returns an approval request if it exists
        approval = ApprovalRequestFactory(revision=recipe.latest_revision)
        assert recipe.approval_request == approval

        # Check the edge case where there is no latest_revision
        recipe.latest_revision.delete()
        recipe.refresh_from_db()
        assert recipe.approval_request is None

    def test_revise_arguments(self):
        recipe = RecipeFactory(arguments_json="[]")
        recipe.revise(arguments=[{"id": 1}])
        assert recipe.arguments_json == '[{"id": 1}]'

    def test_enabled_updates_signatures(self, mocked_autograph):
        recipe = RecipeFactory(name="first")
        ar = recipe.latest_revision.request_approval(UserFactory())
        ar.approve(approver=UserFactory(), comment="r+")
        recipe = Recipe.objects.get()
        recipe.approved_revision.enable(UserFactory())

        recipe.refresh_from_db()
        data_to_sign = recipe.canonical_json()
        signature_of_data = fake_sign([data_to_sign])[0]["signature"]
        signature_in_db = recipe.signature.signature
        assert signature_of_data == signature_in_db


@pytest.mark.django_db
class TestRecipeRevision(object):
    def test_approval_status(self):
        recipe = RecipeFactory()
        revision = recipe.latest_revision
        assert revision.approval_status is None

        approval = ApprovalRequestFactory(revision=revision)
        revision = RecipeRevision.objects.get(pk=revision.pk)
        assert revision.approval_status == revision.PENDING

        approval.approve(UserFactory(), "r+")
        revision = RecipeRevision.objects.get(pk=revision.pk)
        assert revision.approval_status == revision.APPROVED

        approval.delete()
        approval = ApprovalRequestFactory(revision=revision)
        approval.reject(UserFactory(), "r-")
        revision = RecipeRevision.objects.get(pk=revision.pk)
        assert revision.approval_status == revision.REJECTED

    def test_enable(self):
        recipe = RecipeFactory(name="Test")
        with pytest.raises(EnabledState.NotActionable):
            recipe.latest_revision.enable(user=UserFactory())

        approval_request = recipe.latest_revision.request_approval(creator=UserFactory())
        approval_request.approve(approver=UserFactory(), comment="r+")

        recipe.revise(name="New name")
        with pytest.raises(EnabledState.NotActionable):
            recipe.latest_revision.enable(user=UserFactory())

        recipe.approved_revision.enable(user=UserFactory())
        assert recipe.enabled

        with pytest.raises(EnabledState.NotActionable):
            recipe.approved_revision.enable(user=UserFactory())

        approval_request = recipe.latest_revision.request_approval(creator=UserFactory())
        approval_request.approve(approver=UserFactory(), comment="r+")
        assert recipe.enabled

    def test_disable(self):
        recipe = RecipeFactory(name="Test", approver=UserFactory(), enabler=UserFactory())
        assert recipe.enabled

        recipe.approved_revision.disable(user=UserFactory())
        assert not recipe.enabled

        with pytest.raises(EnabledState.NotActionable):
            recipe.approved_revision.disable(user=UserFactory())

        recipe.revise(name="New name")

        with pytest.raises(EnabledState.NotActionable):
            recipe.latest_revision.disable(user=UserFactory())

    def test_it_publishes_when_enabled(self, mocked_remotesettings):
        recipe = RecipeFactory(name="Test")

        approval_request = recipe.latest_revision.request_approval(creator=UserFactory())
        approval_request.approve(approver=UserFactory(), comment="r+")
        recipe.approved_revision.enable(user=UserFactory())

        mocked_remotesettings.return_value.publish.assert_called_with(recipe)

        # Publishes once when enabled twice.
        with pytest.raises(EnabledState.NotActionable):
            recipe.approved_revision.enable(user=UserFactory())

        assert mocked_remotesettings.return_value.publish.call_count == 1

    def test_it_publishes_new_revisions_if_enabled(self, mocked_remotesettings):
        recipe = RecipeFactory(name="Test", approver=UserFactory(), enabler=UserFactory())
        assert mocked_remotesettings.return_value.publish.call_count == 1

        recipe.revise(name="Modified")
        approval_request = recipe.latest_revision.request_approval(creator=UserFactory())
        approval_request.approve(approver=UserFactory(), comment="r+")

        assert mocked_remotesettings.return_value.publish.call_count == 2
        second_call_args, _ = mocked_remotesettings.return_value.publish.call_args_list[1]
        modified_recipe, = second_call_args
        assert modified_recipe.name == "Modified"

    def test_it_does_not_publish_when_approved_if_not_enabled(self, mocked_remotesettings):
        recipe = RecipeFactory(name="Test")

        approval_request = recipe.latest_revision.request_approval(creator=UserFactory())
        approval_request.approve(approver=UserFactory(), comment="r+")

        assert not mocked_remotesettings.return_value.publish.called

    def test_it_unpublishes_when_disabled(self, mocked_remotesettings):
        recipe = RecipeFactory(name="Test", approver=UserFactory(), enabler=UserFactory())

        recipe.approved_revision.disable(user=UserFactory())

        mocked_remotesettings.return_value.unpublish.assert_called_with(recipe)

        # Unpublishes once when disabled twice.
        with pytest.raises(EnabledState.NotActionable):
            recipe.approved_revision.disable(user=UserFactory())

        assert mocked_remotesettings.return_value.publish.call_count == 1

    def test_it_publishes_several_times_when_reenabled(self, mocked_remotesettings):
        recipe = RecipeFactory(name="Test", approver=UserFactory(), enabler=UserFactory())

        recipe.approved_revision.disable(user=UserFactory())
        recipe.approved_revision.enable(user=UserFactory())

        assert mocked_remotesettings.return_value.unpublish.call_count == 1
        assert mocked_remotesettings.return_value.publish.call_count == 2

    def test_it_rollbacks_changes_if_error_happens_on_publish(self, mocked_remotesettings):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        error = remote_settings_exceptions.KintoException
        mocked_remotesettings.return_value.publish.side_effect = error

        with pytest.raises(error):
            recipe.approved_revision.enable(user=UserFactory())

        saved = Recipe.objects.get(id=recipe.id)
        assert not saved.approved_revision.enabled

    def test_it_rollbacks_changes_if_error_happens_on_unpublish(self, mocked_remotesettings):
        recipe = RecipeFactory(name="Test", approver=UserFactory(), enabler=UserFactory())
        error = remote_settings_exceptions.KintoException
        mocked_remotesettings.return_value.unpublish.side_effect = error

        with pytest.raises(error):
            recipe.approved_revision.disable(user=UserFactory())

        saved = Recipe.objects.get(id=recipe.id)
        assert saved.approved_revision.enabled

    def test_enable_rollback_enable_rollout_invariance(self):
        rollout_recipe = RecipeFactory(
            name="Rollout",
            approver=UserFactory(),
            enabler=UserFactory(),
            action=ActionFactory(name="preference-rollout"),
            arguments={"slug": "myslug"},
        )
        assert rollout_recipe.enabled

        rollback_recipe = RecipeFactory(
            name="Rollback",
            action=ActionFactory(name="preference-rollback"),
            arguments={"rolloutSlug": "myslug"},
        )
        approval_request = rollback_recipe.latest_revision.request_approval(creator=UserFactory())
        approval_request.approve(approver=UserFactory(), comment="r+")

        with pytest.raises(ValidationError) as exc_info:
            rollback_recipe.approved_revision.enable(user=UserFactory())
        assert exc_info.value.message == "Rollout recipe 'Rollout' is currently enabled"

        rollout_recipe.approved_revision.disable(user=UserFactory())
        assert not rollout_recipe.enabled
        # Now it should be possible to enable the rollback recipe.
        rollback_recipe.approved_revision.enable(user=UserFactory())
        assert rollback_recipe.enabled

        # Can't make up your mind. Now try to enable the rollout recipe again even though
        # the rollback recipe is enabled.
        with pytest.raises(ValidationError) as exc_info:
            rollout_recipe.approved_revision.enable(user=UserFactory())
        assert exc_info.value.message == "Rollback recipe 'Rollback' is currently enabled"


@pytest.mark.django_db
class TestApprovalRequest(object):
    def test_approve(self, mocker):
        u = UserFactory()
        req = ApprovalRequestFactory()
        mocker.patch.object(req, "verify_approver")

        req.approve(u, "r+")
        assert req.approved
        assert req.approver == u
        assert req.comment == "r+"
        req.verify_approver.assert_called_with(u)

        recipe = req.revision.recipe
        assert recipe.is_approved

    def test_cannot_approve_already_approved(self):
        u = UserFactory()
        req = ApprovalRequestFactory()
        req.approve(u, "r+")

        with pytest.raises(req.NotActionable):
            req.approve(u, "r+")

    def test_reject(self, mocker):
        u = UserFactory()
        req = ApprovalRequestFactory()
        mocker.patch.object(req, "verify_approver")

        req.reject(u, "r-")
        assert not req.approved
        assert req.approver == u
        assert req.comment == "r-"
        req.verify_approver.assert_called_with(u)

        recipe = req.revision.recipe
        assert not recipe.is_approved

    def test_cannot_reject_already_rejected(self):
        u = UserFactory()
        req = ApprovalRequestFactory()
        req.reject(u, "r-")

        with pytest.raises(req.NotActionable):
            req.reject(u, "r-")

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
        logger = mocker.patch("normandy.recipes.models.logger")
        settings.PEER_APPROVAL_ENFORCED = False

        creator = UserFactory()
        user = UserFactory()
        req = ApprovalRequestFactory(creator=creator)

        # Do not raise when creator and approver are different
        req.verify_approver(user)

        # Do not raise when creator and approver are the same since enforcement
        # is disabled.
        req.verify_approver(creator)
        logger.warning.assert_called_with(
            Whatever(),
            extra={
                "code": WARNING_BYPASSING_PEER_APPROVAL,
                "approval_id": req.id,
                "approver": creator,
            },
        )

    def test_enabled_state_carried_over_on_approval(self):
        recipe = RecipeFactory(approver=UserFactory(), enabler=UserFactory())
        carryover_from = recipe.approved_revision.enabled_state
        recipe.revise(name="New name")
        approval_request = recipe.latest_revision.request_approval(UserFactory())
        approval_request.approve(UserFactory(), "r+")
        assert recipe.enabled
        assert recipe.approved_revision.enabled_state.carryover_from == carryover_from


class TestClient(object):
    def test_geolocation(self, rf, settings):
        settings.NUM_PROXIES = 1
        req = rf.post("/", X_FORWARDED_FOR="fake, 1.1.1.1", REMOTE_ADDR="2.2.2.2")
        client = Client(req)

        with patch("normandy.recipes.models.get_country_code") as get_country_code:
            assert client.country == get_country_code.return_value
            assert get_country_code.called_with("1.1.1.1")

    def test_initial_values(self, rf):
        """Ensure that computed properties can be overridden."""
        req = rf.post("/", X_FORWARDED_FOR="fake, 1.1.1.1", REMOTE_ADDR="2.2.2.2")
        client = Client(req, country="FAKE", request_time="FAKE")
        assert client.country == "FAKE"
        assert client.request_time == "FAKE"
