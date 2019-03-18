import factory
import json
import os
import tempfile
import zipfile

from normandy.base.tests import FuzzyUnicode
from normandy.studies.models import Extension


INSTALL_RDF_TEMPLATE = """<?xml version="1.0" encoding="utf-8"?>
<RDF xmlns="http://w3.org/1999/02/22-rdf-syntax-ns#" xmlns:em="http://mozilla.org/2004/em-rdf#">
  <Description about="urn:mozilla:install-manifest">
    <em:type>2</em:type>
    <em:bootstrap>true</em:bootstrap>
    <em:unpack>false</em:unpack>
    <em:multiprocessCompatible>true</em:multiprocessCompatible>
    {}

    <em:targetApplication>
      <Description>
        <em:id>{{ec8030f7-c20a-464f-9b0e-13a3a9e97384}}</em:id>
        <em:minVersion>52.0</em:minVersion>
        <em:maxVersion>*</em:maxVersion>
      </Description>
    </em:targetApplication>
  </Description>
</RDF>
"""


class XPIFileFactory(object):
    def __init__(self, signed=True):
        # Generate a unique random path for the new XPI file
        f, self._path = tempfile.mkstemp(suffix=".xpi")

        # Ensure the path exists
        os.makedirs(os.path.dirname(self._path), exist_ok=True)

        # Create a blank zip file on disk
        zf = zipfile.ZipFile(self.path, mode="w")
        zf.close()

        if signed:
            self.add_file("META-INF/manifest.mf", b"")
            self.add_file("META-INF/mozilla.rsa", b"")
            self.add_file("META-INF/mozilla.sf", b"")

    @property
    def path(self):
        return self._path

    def add_file(self, filename, data):
        with zipfile.ZipFile(self.path, mode="a") as zf:
            with zf.open(filename, mode="w") as f:
                f.write(data)

    def open(self, mode="rb"):
        return open(self.path, mode="rb")


class WebExtensionFileFactory(XPIFileFactory):
    def __init__(self, signed=True, from_file=None, gecko_id=None, overwrite_data=None):
        super().__init__(signed=signed)

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

    @property
    def manifest(self):
        return self._manifest

    def save_manifest(self):
        self.add_file("manifest.json", json.dumps(self.manifest).encode())

    def update_manifest(self, data):
        self._manifest.update(data)
        self.save_manifest()

    def replace_manifest(self, data):
        self._manifest = data
        self.save_manifest()


class LegacyAddonFileFactory(XPIFileFactory):
    def __init__(self, signed=True, from_file=None, addon_id=None, overwrite_data=None):
        super().__init__(signed=signed)

        if not addon_id:
            addon_id = f"{factory.Faker('md5').generate({})}@normandy.mozilla.org"

        if from_file:
            with open(from_file, "rb") as f:
                self.add_file("install.rdf", f.read())
        else:
            data = {
                "id": addon_id,
                "version": "0.1",
                "name": "Signed Bootstrap Mozilla Extension Example",
                "description": "Example of a bootstrapped addon",
            }

            if overwrite_data:
                data.update(overwrite_data)

            self.generate_install_rdf(data)

    def generate_install_rdf(self, data):
        insert = ""
        for k in data:
            insert += "<em:{}>{}</em:{}>\n".format(k, data[k], k)
        self.add_file("install.rdf", INSTALL_RDF_TEMPLATE.format(insert).encode())


class ExtensionFactory(factory.DjangoModelFactory):
    name = FuzzyUnicode()
    xpi = factory.django.FileField(from_func=lambda: WebExtensionFileFactory().open())

    class Meta:
        model = Extension
