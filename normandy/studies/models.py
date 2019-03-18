import hashlib
import json
import zipfile

import untangle

from xml.sax import SAXParseException

from django.core.exceptions import ValidationError
from django.db import models

from dirtyfields import DirtyFieldsMixin

from normandy.recipes.models import Recipe


SIGNING_FILES = {"META-INF/mozilla.rsa", "META-INF/mozilla.sf", "META-INF/manifest.mf"}


class Extension(DirtyFieldsMixin, models.Model):
    name = models.CharField(max_length=255)
    xpi = models.FileField(upload_to="extensions")
    is_legacy = models.BooleanField(default=False)
    extension_id = models.CharField(max_length=255)
    version = models.CharField(max_length=32)
    hash = models.CharField(max_length=64)
    hash_algorithm = models.CharField(max_length=16)

    class Meta:
        ordering = ("-id",)

    @property
    def recipes_used_by(self):
        """Set of enabled recipes that are using this extension."""
        return Recipe.objects.filter(latest_revision__arguments_json__contains=self.xpi.url)

    def populate_metadata(self):
        # Validate XPI file
        try:
            with zipfile.ZipFile(self.xpi) as zf:
                files = set(zf.namelist())

                # Verify this is a web extension or legacy addon
                if "manifest.json" in files:  # Web extension
                    with zf.open("manifest.json") as manifest_file:
                        try:
                            data = json.load(manifest_file)
                        except json.decoder.JSONDecodeError:
                            raise ValidationError({"xpi": "Web extension manifest is corrupt."})

                    self.extension_id = (
                        data.get("applications", {}).get("gecko", {}).get("id", None)
                    )
                    self.version = data.get("version")

                    if not self.extension_id:
                        raise ValidationError(
                            {
                                "xpi": (
                                    "Web extensions must have a manifest key "
                                    '"applications.gecko.id".'
                                )
                            }
                        )

                    if not self.version:
                        raise ValidationError(
                            {"xpi": 'Web extensions must have a manifest key "version".'}
                        )
                elif "install.rdf" in files:  # Legacy addon
                    self.is_legacy = True

                    with zf.open("install.rdf", "r") as rdf_file:
                        try:
                            data = untangle.parse(rdf_file.read().decode())
                        except SAXParseException:
                            raise ValidationError(
                                {"xpi": 'Legacy addon "install.rdf" is corrupt.'}
                            )

                    try:
                        self.extension_id = data.RDF.Description.em_id.cdata
                        self.version = data.RDF.Description.em_version.cdata
                    except AttributeError:
                        pass  # Ignore as this will be dealt with in the next step

                    if not self.extension_id:
                        raise ValidationError(
                            {"xpi": 'Legacy addons "install.rdf" must specify an id.'}
                        )

                    if not self.version:
                        raise ValidationError(
                            {"xpi": 'Legacy addons "install.rdf" must specify a version.'}
                        )
                else:
                    raise ValidationError(
                        {"xpi": "Extension file must be a valid WebExtension or legacy addon."}
                    )

                # Verify the extension is signed
                if not SIGNING_FILES.issubset(files):
                    raise ValidationError({"xpi": "Extension file must be signed."})
        except zipfile.BadZipFile:
            raise ValidationError({"xpi": "Extension file must be zip-formatted."})

        # Make sure to read the XPI file from the start before hashing
        self.xpi.seek(0)
        self.hash = hashlib.sha256(self.xpi.read()).hexdigest()
        self.hash_algorithm = "sha256"

    def save(self, *args, **kwargs):
        dirty_fields = {
            k: v
            for k, v in self.get_dirty_fields(check_relationship=True, verbose=True).items()
            if v["saved"] != v["current"]
        }

        if dirty_fields:
            dirty_field_names = list(dirty_fields.keys())

            if "xpi" in dirty_field_names:
                self.populate_metadata()

        super().save(*args, **kwargs)
