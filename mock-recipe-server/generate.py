#!/usr/bin/env python
"""
Script for generating static HTML files suitable for hosting on a static
host (like AWS S3) that mock out the Normandy recipe server API for
particular test cases.
"""
import os
import sys
from pathlib import Path

import configurations


# Add normandy to the import path and setup Django stuff.
sys.path.insert(0, '/app')
sys.path.insert(0, '/mock-server')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "normandy.settings")
configurations.setup()


# Now that Django is set up we can import Django things.
from django.template import Context, Template  # noqa

from testcases import get_testcases  # noqa
from utils import APIPath  # noqa


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
        testcase_api_path = APIPath(build_path / testcase.name)
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
