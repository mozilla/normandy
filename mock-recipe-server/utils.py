from pathlib import Path

from django.test import Client


client = Client()


class APIPath(object):
    """Represents an API URL that is mirrored on the filesystem."""
    def __init__(self, base_path, segments=None):
        self.base_path = base_path
        self.segments = segments or []

    @property
    def url(self):
        """Generate the current URL string."""
        path = '/'.join(self.segments)
        return f'/{path}/'

    @property
    def path(self):
        """Generate a Path object for the current URL."""
        return Path(self.base_path, *self.segments)

    @property
    def index_path(self):
        """Generate a Path object for the current URL's index file."""
        return self.path / 'index.html'

    def add(self, *paths):
        """Add segments to the current URL."""
        return APIPath(self.base_path, self.segments + list(paths))

    def fetch(self):
        """Fetch the response text for the current URL."""
        return client.get(self.url).content.decode()

    def read(self):
        """Read data on the filesystem for the current URL."""
        with self.index_path.open() as f:
            return f.read()

    def save(self, data=None):
        """
        Save data to the filesystem for the current URL.

        :param data:
            File contents to save. If not given, the current URL will
            be remotely fetched and saved.
        """
        data = data or self.fetch()
        self.path.mkdir(parents=True, exist_ok=True)
        with self.index_path.open(mode='w') as f:
            f.write(data)
