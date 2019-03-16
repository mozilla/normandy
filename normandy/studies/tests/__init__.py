import factory
import json
import os
import tempfile
import zipfile

from normandy.base.tests import FuzzyUnicode
from normandy.studies.models import Extension


DATA_DIR = os.path.join(os.path.abspath(os.path.dirname(__file__)), "data")


class XPIFileFactory(object):
    def __init__(self, from_file=None, gecko_id=None, overwrite_data=None, signed=True):
        # Generate a unique random path for the new XPI file
        f, self._path = tempfile.mkstemp(suffix=".xpi")

        # Ensure the path exists
        os.makedirs(os.path.dirname(self._path), exist_ok=True)

        # Create a blank zip file on disk
        zf = zipfile.ZipFile(self.path, mode="w")
        zf.close()

        if not gecko_id:
            gecko_id = f"{factory.Faker('md5').generate({})}@normandy.mozilla.org"

        if from_file:
            self._manifest = json.load(from_file)
        else:
            self._manifest = {
                "manifest_version": 2,
                "name": "normandy test addon",
                "version": "0.1",
                "description": "This is an add-on for us in Normandy's tests",
                "applications": {"gecko": {"id": gecko_id}},
            }

        if overwrite_data:
            self._manifest.update(overwrite_data)

        self.save_manifest()

        if signed:
            self.add_file("META-INF/manifest.mf", b"")
            self.add_file("META-INF/mozilla.rsa", b"")
            self.add_file("META-INF/mozilla.sf", b"")

    @property
    def path(self):
        return self._path

    @property
    def manifest(self):
        return self._manifest

    def add_file(self, filename, data):
        with zipfile.ZipFile(self.path, mode="a") as zf:
            with zf.open(filename, mode="w") as f:
                f.write(data)

    def save_manifest(self):
        self.add_file("manifest.json", json.dumps(self.manifest).encode())

    def update_manifest(self, data):
        self._manifest.update(data)
        self.save_manifest()

    def replace_manifest(self, data):
        self._manifest = data
        self.save_manifest()

    def open(self, mode="rb"):
        return open(self.path, mode="rb")


class ExtensionFactory(factory.DjangoModelFactory):
    name = FuzzyUnicode()
    xpi = factory.django.FileField(from_func=lambda: XPIFileFactory().open())

    class Meta:
        model = Extension
