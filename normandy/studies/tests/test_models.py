import os
import pytest

from django.core.exceptions import ValidationError

from normandy.recipes.tests import RecipeFactory
from normandy.studies.tests import ExtensionFactory


DATA_DIR = os.path.join(os.path.abspath(os.path.dirname(__file__)), "data")


def data_path(fn):
    return os.path.join(DATA_DIR, fn)


class TestExtension(object):
    @pytest.mark.django_db
    def test_recipes_used_by(self, storage):
        extension = ExtensionFactory()
        RecipeFactory()  # Create a recipe that doesn't use the extension
        used_in_recipe_1 = RecipeFactory(
            name="test 1", arguments_json=f'{{"xpi_url": "{extension.xpi.url}"}}'
        )
        used_in_recipe_2 = RecipeFactory(
            name="test 2", arguments_json=f'{{"xpi_url": "{extension.xpi.url}"}}'
        )

        assert set(extension.recipes_used_by) == set([used_in_recipe_1, used_in_recipe_2])

    @pytest.mark.django_db
    def test_webext_id(self, storage):
        extension = ExtensionFactory(xpi__from_path=data_path("webext-signed.xpi"))
        assert extension.webext_id == "test-addon@normandy.mozilla.org"

    @pytest.mark.django_db
    def test_version(self, storage):
        extension = ExtensionFactory(xpi__from_path=data_path("webext-signed.xpi"))
        assert extension.version == "0.1"

    @pytest.mark.django_db
    def test_hash(self, storage):
        extension = ExtensionFactory(xpi__from_path=data_path("webext-signed.xpi"))
        assert extension.hash == "7c0e9203de9538b1a7513d28ec344a5712f9237f2bcd494db31344dea378baf5"

    @pytest.mark.django_db()
    def test_xpi_not_a_zip(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_path=data_path("not-an-addon.txt"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert exc.value.error_dict["xpi"][0].message == "Extension file must be zip-formatted."

    @pytest.mark.django_db()
    def test_xpi_not_an_addon(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_path=data_path("not-an-addon.zip"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert (
            exc.value.error_dict["xpi"][0].message
            == "Extension file must be a valid WebExtension or legacy addon."
        )

    @pytest.mark.django_db()
    def test_webext_bad_manifest(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_path=data_path("webext-bad-manifest-unsigned.xpi"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert exc.value.error_dict["xpi"][0].message == "Web extension manifest is corrupt."

    @pytest.mark.django_db()
    def test_webext_no_id(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_path=data_path("webext-no-id-unsigned.xpi"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert (
            exc.value.error_dict["xpi"][0].message
            == 'Web extensions must have a manifest key "applications.gecko.id".'
        )

    @pytest.mark.django_db()
    def test_webext_no_version(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_path=data_path("webext-no-version-unsigned.xpi"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert (
            exc.value.error_dict["xpi"][0].message
            == 'Web extensions must have a manifest key "version".'
        )

    @pytest.mark.django_db()
    def test_legacy_bad_install_rdf(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_path=data_path("legacy-bad-install-rdf-unsigned.xpi"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert exc.value.error_dict["xpi"][0].message == 'Legacy addon "install.rdf" is corrupt.'

    @pytest.mark.django_db()
    def test_legacy_no_id(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_path=data_path("legacy-no-id-unsigned.xpi"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert (
            exc.value.error_dict["xpi"][0].message
            == 'Legacy addons "install.rdf" must specify an id.'
        )

    @pytest.mark.django_db()
    def test_legacy_no_version(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_path=data_path("legacy-no-version-unsigned.xpi"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert (
            exc.value.error_dict["xpi"][0].message
            == 'Legacy addons "install.rdf" must specify a version.'
        )

    @pytest.mark.django_db()
    def test_xpi_must_be_signed(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_path=data_path("webext-unsigned.xpi"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert exc.value.error_dict["xpi"][0].message == "Extension file must be signed."

        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_path=data_path("legacy-unsigned.xpi"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert exc.value.error_dict["xpi"][0].message == "Extension file must be signed."
