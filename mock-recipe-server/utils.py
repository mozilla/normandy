from pathlib import Path
from urllib.parse import urljoin

import requests


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

    def read(self):
        """Read data on the filesystem for the current URL."""
        with self.path.open() as f:
            return f.read()

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
