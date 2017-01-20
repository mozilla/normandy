#!/usr/bin/env python
"""
Script for generating static HTML files suitable for hosting on a static
host (like AWS S3) that mock out the Normandy recipe server API for
particular test cases.
"""
import json
import os
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse

import configurations
import requests


# Add normandy to the import path and setup Django stuff.
sys.path.insert(0, '/app')
sys.path.insert(0, '/mock-server')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "normandy.settings")
configurations.setup()


# Now that Django is set up we can import Django things.
from django.template import Context, Template  # noqa

from normandy.base.utils import canonical_json_dumps  # noqa
from normandy.recipes.api.serializers import ClientSerializer  # noqa
from normandy.recipes.models import Action  # noqa

from fixtures import get_fixtures  # noqa


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
    Load each defined fixture from fixtures.py and save the state of the API
    after each fixture is loaded.
    """
    build_path = Path(sys.argv[1])
    domain = sys.argv[2]
    fixtures = get_fixtures()
    for fixture in fixtures:
        fixture.load()
        fixture_api_path = APIPath(build_path / fixture.name, 'https://proxy:8443')
        serialize_api(fixture, fixture_api_path, domain)

    # Write the root index page.
    index_template_path = Path(__file__).parent / 'api_index.html'
    with index_template_path.open() as f:
        index_template = Template(f.read())

    context = Context({'fixtures': fixtures})
    index_path = build_path / 'index.html'
    with index_path.open(mode='w') as f:
        f.write(index_template.render(context))


def serialize_api(fixture, api_path, domain):
    """
    Fetch API responses from the service and save them to the
    filesystem.

    :param fixture:
        Fixture object that was last loaded to provide a client object
        to serialize to the client classification endpoint.
    :param api_path:
        APIPath object for the root URL and path to fetch and save
        responses from and to.
    :param domain:
        Protocol and domain to use for absolute URLs in the serialized
        API.
    """
    root_path = api_path.add('api', 'v1')

    # Recipe endpoints
    root_path.add('recipe').save()
    root_path.add('recipe', 'signed').save()

    # Client classification (manually rendered as canonical json)
    client = fixture.client()
    client_data = ClientSerializer(client).data
    client_json = canonical_json_dumps(client_data)
    root_path.add('classify_client').save(client_json)

    for action in Action.objects.all():
        # Action
        action_path = root_path.add('action', action.name)

        action_data = json.loads(action_path.fetch())
        new_url = update_url(action_data['implementation_url'], fixture, domain)
        action_data['implementation_url'] = new_url
        action_json = canonical_json_dumps(action_data)
        action_path.save(action_json)

        # Action implementation
        action_path.add('implementation', action.implementation_hash).save()


def update_url(url, fixture, domain):
    """
    Modify the URL to use the domain and to add the name of the given
    fixture as the first path segment.
    """
    parsed_url = urlparse(url)
    parsed_domain = urlparse(domain)
    return urlunparse((
        parsed_domain.scheme,
        parsed_domain.netloc,
        '/' + fixture.name + parsed_url.path,
        parsed_url.params,
        parsed_url.query,
        parsed_url.fragment,
    ))


if __name__ == '__main__':
    main()
