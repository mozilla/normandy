from datetime import timedelta

from django.db.utils import ProgrammingError

import pytest
import requests.exceptions

from normandy.recipes import checks, signing
from normandy.recipes.tests import ActionFactory, RecipeFactory, SignatureFactory, UserFactory


@pytest.mark.django_db
class TestSignaturesUseGoodCertificates(object):
    def test_it_works(self):
        assert checks.signatures_use_good_certificates(None) == []

    def test_it_fails_if_a_signature_does_not_verify(self, mocker, settings):
        settings.CERTIFICATES_EXPIRE_EARLY_DAYS = None
        recipe = RecipeFactory(approver=UserFactory(), signed=True)
        mock_verify_x5u = mocker.patch("normandy.recipes.checks.signing.verify_x5u")
        mock_verify_x5u.side_effect = signing.BadCertificate("testing exception")

        errors = checks.signatures_use_good_certificates(None)
        mock_verify_x5u.assert_called_once_with(recipe.signature.x5u, None)
        assert len(errors) == 1
        assert errors[0].id == checks.ERROR_BAD_SIGNING_CERTIFICATE
        assert recipe.approved_revision.name in errors[0].msg

    def test_it_ignores_signatures_without_x5u(self):
        recipe = RecipeFactory(approver=UserFactory(), signed=True)
        recipe.signature.x5u = None
        recipe.signature.save()
        actions = ActionFactory(signed=True)
        actions.signature.x5u = None
        actions.signature.save()
        assert checks.signatures_use_good_certificates(None) == []

    def test_it_ignores_signatures_not_in_use(self, mocker, settings):
        settings.CERTIFICATES_EXPIRE_EARLY_DAYS = None
        recipe = RecipeFactory(approver=UserFactory(), signed=True)
        SignatureFactory(x5u="https://example.com/bad_x5u")  # unused signature
        mock_verify_x5u = mocker.patch("normandy.recipes.checks.signing.verify_x5u")

        def side_effect(x5u, *args):
            if "bad" in x5u:
                raise signing.BadCertificate("testing exception")
            return True

        mock_verify_x5u.side_effect = side_effect

        errors = checks.signatures_use_good_certificates(None)
        mock_verify_x5u.assert_called_once_with(recipe.signature.x5u, None)
        assert errors == []

    def test_it_passes_expire_early_setting(self, mocker, settings):
        settings.CERTIFICATES_EXPIRE_EARLY_DAYS = 7
        recipe = RecipeFactory(approver=UserFactory(), signed=True)
        mock_verify_x5u = mocker.patch("normandy.recipes.checks.signing.verify_x5u")

        errors = checks.signatures_use_good_certificates(None)
        mock_verify_x5u.assert_called_once_with(recipe.signature.x5u, timedelta(7))
        assert errors == []

    def test_it_reports_x5u_network_errors(self, mocker):
        RecipeFactory(approver=UserFactory(), signed=True)
        mock_verify_x5u = mocker.patch("normandy.recipes.checks.signing.verify_x5u")
        mock_verify_x5u.side_effect = requests.exceptions.ConnectionError
        errors = checks.signatures_use_good_certificates(None)
        mock_verify_x5u.assert_called_once()
        assert len(errors) == 1
        assert errors[0].id == checks.ERROR_COULD_NOT_VERIFY_CERTIFICATE


@pytest.mark.django_db
class TestRecipeSignatureAreCorrect:
    def test_it_warns_if_a_field_isnt_available(self, mocker):
        """This is to allow for un-applied to migrations to not break running migrations."""
        RecipeFactory(approver=UserFactory(), signed=True)
        mock_canonical_json = mocker.patch("normandy.recipes.models.Recipe.canonical_json")
        mock_canonical_json.side_effect = ProgrammingError("error for testing")
        errors = checks.recipe_signatures_are_correct(None)
        assert len(errors) == 1
        assert errors[0].id == checks.WARNING_COULD_NOT_CHECK_SIGNATURES


@pytest.mark.django_db
class TestActionSignatureAreCorrect:
    def test_it_warns_if_a_field_isnt_available(self, mocker):
        """This is to allow for un-applied to migrations to not break running migrations."""
        ActionFactory(signed=True)
        mock_canonical_json = mocker.patch("normandy.recipes.models.Action.canonical_json")
        mock_canonical_json.side_effect = ProgrammingError("error for testing")
        errors = checks.action_signatures_are_correct(None)
        assert len(errors) == 1
        assert errors[0].id == checks.WARNING_COULD_NOT_CHECK_SIGNATURES
