#!/usr/bin/env python
"""
Script for generating static HTML files suitable for hosting on a static
host (like AWS S3) that mock out the Normandy recipe server API for
particular test cases.
"""
import os
import sys
from pathlib import Path
from urllib.parse import urljoin

import configurations
import requests


# Add normandy to the import path and setup Django stuff.
sys.path.insert(0, '/app')
sys.path.insert(0, '/mock-server')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "normandy.settings")
configurations.setup()


# Now that Django is set up we can import Django things.
from django.template import Context, Template  # noqa

from testcases import get_testcases  # noqa


class APIPath(object):
    """Represents an API URL that is mirrored on the filesystem."""
    def __init__(self, base_path, base_url, segments=None):
        self.base_path = base_path
        self.base_url = base_url
        self.segments = segments or []

    @property
    def url(self):
        """Generate the current URL string."""
        return urljoin(self.base_url, '/'.join(self.segments) + '/')

    @property
    def path(self):
        """Generate a Path object for the current URL."""
        return Path(self.base_path, *self.segments, 'index.html')

    def add(self, *paths):
        """Add segments to the current URL."""
        return APIPath(self.base_path, self.base_url, self.segments + list(paths))

    def fetch(self):
        """Fetch the response text for the current URL."""
        response = requests.get(self.url, verify=False)
        response.raise_for_status()
        return response.text

    def save(self, data=None):
        """
        Save data to the filesystem for the current URL.

        :param data:
            File contents to save. If not given, the current URL will
            be remotely fetched and saved.
        """
        data = data or self.fetch()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open(mode='w') as f:
            f.write(data)


def main():
    """
    Load each defined testcase from testcases.py and save the state of
    the API after each testcase is loaded.
    """
    build_path = Path(sys.argv[1])
    domain = sys.argv[2]
    testcases = get_testcases()
    for testcase in testcases:
        testcase.load()
        testcase_api_path = APIPath(build_path / testcase.name, 'https://proxy:8443')
        testcase.serialize_api(testcase_api_path, domain)

    # Write the root index page.
    index_template_path = Path(__file__).parent / 'api_index.html'
    with index_template_path.open() as f:
        index_template = Template(f.read())

    context = Context({'testcases': testcases})
    index_path = build_path / 'index.html'
    with index_path.open(mode='w') as f:
        f.write(index_template.render(context))


if __name__ == '__main__':
    main()
