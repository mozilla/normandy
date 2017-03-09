#!/usr/bin/env python
"""
Tests that make assertions about the test cases.
"""
import json
import sys
from pathlib import Path
from textwrap import dedent


tests = []


def main():
    """
    Load each test case from build_path and run a series of checks on them.
    """
    build_path = Path(sys.argv[1])

    for child in build_path.iterdir():
        if not child.is_dir():
            continue

        for test in tests:
            test(child)


def test(test_func):
    tests.append(test_func)


@test
def recipes_match_signed_and_unsigned(path):
    api_root = path / 'api' / 'v1'
    with open(api_root / 'recipe' / 'index.html') as f:
        unsigned_data = json.load(f)
    with open(api_root / 'recipe' / 'signed' / 'index.html') as f:
        signed_data = json.load(f)

    unsigned_recipes = sorted(r for r in unsigned_data)
    signed_recipes = sorted(rs['recipe'] for rs in signed_data)

    try:
        assert signed_recipes == unsigned_recipes
    except AssertionError:
        print(dedent(f'''
            Failure in test case {path}.
            Expected signed recipes:

            """
            {signed_recipes}
            """

            to equal unsigned recipes:

            """
            {unsigned_recipes}
            """
        '''))
        raise


if __name__ == '__main__':
    main()
