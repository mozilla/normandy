import json
from os.path import join, dirname
from jsonschema import validate

SCHEMA_FILE = 'normandy-schema.json'

def assert_valid_schema(data):
    schema = _load_json_schema()
    return validate(data, schema)


def _load_json_schema():
    relative_path = join('schemas', SCHEMA_FILE)
    absolute_path = join(dirname(__file__), relative_path)

    with open(absolute_path) as schema_file:
        return json.loads(schema_file.read())

