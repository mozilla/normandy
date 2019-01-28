import json
import zipfile

from rest_framework.fields import FileField


class ExtensionFileField(FileField):
    default_error_messages = {
        "not_a_zip": "Extension file must be zip-formatted.",
        "not_signed": "Extension file must be signed.",
        "no_id": 'Web extensions must have a manifest key "applications.gecko.id".',
        "bad_manifest": "Web extension manifest is corrupt.",
    }

    def to_internal_value(self, data):
        try:
            xpi_zip = zipfile.ZipFile(data)
        except zipfile.BadZipFile:
            self.fail("not_a_zip")

        if self._is_webext(xpi_zip):
            self._has_extension_id(xpi_zip)
        self._is_signed(xpi_zip)

        return super().to_internal_value(data)

    def _is_webext(self, xpi_zip):
        if "manifest.json" not in xpi_zip.namelist():
            return False
        with xpi_zip.open("manifest.json") as manifest_file:
            try:
                json.load(manifest_file)
            except json.decoder.JSONDecodeError:
                self.fail("bad_manifest")
        return True

    def _has_extension_id(self, xpi_zip):
        with xpi_zip.open("manifest.json") as manifest_file:
            data = json.load(manifest_file)
            extension_id = data.get("applications", {}).get("gecko", {}).get("id", None)
            if extension_id is None:
                self.fail("no_id")

    def _is_signed(self, xpi_zip):
        files = set(xpi_zip.namelist())
        signing_files = set(
            ["META-INF/mozilla.rsa", "META-INF/mozilla.sf", "META-INF/manifest.mf"]
        )

        if not signing_files.issubset(files):
            self.fail("not_signed")
