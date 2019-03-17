import hashlib
import os
import pytest
import tempfile
import zipfile

from django.core.exceptions import ValidationError
from django.db import transaction

from normandy.recipes.tests import RecipeFactory
from normandy.studies.models import Extension
from normandy.studies.tests import ExtensionFactory, XPIFileFactory


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
    def test_extension_id(self, storage):
        xpi = XPIFileFactory(gecko_id="test-addon@normandy.mozilla.org")
        extension = ExtensionFactory(xpi__from_func=xpi.open)
        assert extension.extension_id == "test-addon@normandy.mozilla.org"

    @pytest.mark.django_db
    def test_version(self, storage):
        xpi = XPIFileFactory(overwrite_data={"version": "0.1"})
        extension = ExtensionFactory(xpi__from_func=xpi.open)
        assert extension.version == "0.1"

    @pytest.mark.django_db
    def test_hash(self, storage):
        xpi = XPIFileFactory()
        f = xpi.open()
        hashed = hashlib.sha256(f.read()).hexdigest()
        f.close()
        extension = ExtensionFactory(xpi__from_func=xpi.open)
        assert extension.hash == hashed

    @pytest.mark.django_db
    def test_no_duplicate_files(self, storage):
        xpi = XPIFileFactory()
        ExtensionFactory(xpi__from_func=xpi.open)
        with transaction.atomic():
            with pytest.raises(FileExistsError):
                ExtensionFactory(xpi__from_func=xpi.open)
        assert Extension.objects.count() == 1

    @pytest.mark.django_db()
    def test_xpi_not_a_zip(self):
        tmp = tempfile.NamedTemporaryFile(suffix=".txt")
        tmp.write(b"not an addon")
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_func=lambda: tmp)
        assert len(exc.value.error_dict["xpi"]) == 1
        assert exc.value.error_dict["xpi"][0].message == "Extension file must be zip-formatted."

    @pytest.mark.django_db()
    def test_xpi_not_an_addon(self, tmpdir):
        _, path = tempfile.mkstemp(suffix=".zip")
        file = open(path, "w+b")
        zf = zipfile.ZipFile(file, mode="w")
        with zf.open("not-addon.txt", mode="w") as tf:
            tf.write(b"not an addon")
        zf.close()

        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_func=lambda: file)
        assert len(exc.value.error_dict["xpi"]) == 1
        assert (
            exc.value.error_dict["xpi"][0].message
            == "Extension file must be a valid WebExtension or legacy addon."
        )

    @pytest.mark.django_db()
    def test_webext_bad_manifest(self):
        xpi = XPIFileFactory(signed=False)
        xpi.add_file("manifest.json", b"")

        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_func=xpi.open)
        assert len(exc.value.error_dict["xpi"]) == 1
        assert exc.value.error_dict["xpi"][0].message == "Web extension manifest is corrupt."

    @pytest.mark.django_db()
    def test_webext_no_id(self):
        xpi = XPIFileFactory(signed=False, overwrite_data={"applications": {"gecko": {}}})
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_func=xpi.open)
        assert len(exc.value.error_dict["xpi"]) == 1
        assert (
            exc.value.error_dict["xpi"][0].message
            == 'Web extensions must have a manifest key "applications.gecko.id".'
        )

    @pytest.mark.django_db()
    def test_webext_no_version(self):
        xpi = XPIFileFactory()
        manifest = xpi.manifest
        del manifest["version"]
        xpi.replace_manifest(manifest)
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_func=xpi.open)
        assert len(exc.value.error_dict["xpi"]) == 1
        assert (
            exc.value.error_dict["xpi"][0].message
            == 'Web extensions must have a manifest key "version".'
        )

    @pytest.mark.django_db()
    def test_legacy_bad_install_rdf(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(
                xpi__from_func=lambda: open(data_path("legacy-bad-install-rdf-unsigned.xpi"), "rb")
            )
        assert len(exc.value.error_dict["xpi"]) == 1
        assert exc.value.error_dict["xpi"][0].message == 'Legacy addon "install.rdf" is corrupt.'

    @pytest.mark.django_db()
    def test_legacy_no_id(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(
                xpi__from_func=lambda: open(data_path("legacy-no-id-unsigned.xpi"), "rb")
            )
        assert len(exc.value.error_dict["xpi"]) == 1
        assert (
            exc.value.error_dict["xpi"][0].message
            == 'Legacy addons "install.rdf" must specify an id.'
        )

    @pytest.mark.django_db()
    def test_legacy_no_version(self):
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(
                xpi__from_func=lambda: open(data_path("legacy-no-version-unsigned.xpi"), "rb")
            )
        assert len(exc.value.error_dict["xpi"]) == 1
        assert (
            exc.value.error_dict["xpi"][0].message
            == 'Legacy addons "install.rdf" must specify a version.'
        )

    @pytest.mark.django_db()
    def test_xpi_must_be_signed(self):
        xpi = XPIFileFactory(signed=False)
        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_func=xpi.open)
        assert len(exc.value.error_dict["xpi"]) == 1
        assert exc.value.error_dict["xpi"][0].message == "Extension file must be signed."

        with pytest.raises(ValidationError) as exc:
            ExtensionFactory(xpi__from_func=lambda: open(data_path("legacy-unsigned.xpi"), "rb"))
        assert len(exc.value.error_dict["xpi"]) == 1
        assert exc.value.error_dict["xpi"][0].message == "Extension file must be signed."
