import canonicaljson
import jsonschema
import pytest

from normandy.recipes.utils import verify_signature
from pytest_testrail.plugin import testrail


@testrail('C5603')
def test_expected_action_types(conf, requests_session):
    r = requests_session.get(conf.getoption('server') + '/api/v1/action/')
    r.raise_for_status()
    response = r.json()

    # Verify we have at least one response and then grab the first record
    assert len(response) >= 1

    # Make sure we only have expected action types
    expected_records = ['console-log', 'show-heartbeat', 'shield-study']

    for record in response:
        assert record['name'] in expected_records


@testrail('C5604')
def test_console_log(conf, requests_session):
    r = requests_session.get(conf.getoption('server') + '/api/v1/action/')
    r.raise_for_status()
    response = r.json()

    # Verify we have at least one response and then grab the first record
    assert len(response) >= 1

    # Look for any console-log actions
    cl_records = [record for record in response if record['name'] == 'console-log']

    if len(cl_records) == 0:
        pytest.skip('No console-log actions found')
        return

    record = cl_records[0]
    # Does an 'action' have all the required fields?
    expected_action_fields = [
        'name',
        'implementation_url',
        'arguments_schema'
    ]
    for field in record:
        assert field in expected_action_fields

    # Do we have a valid schema for 'arguments_schema'?
    r = requests_session.get(record['arguments_schema']['$schema'])
    r.raise_for_status()
    schema = r.json()
    assert jsonschema.validate(record['arguments_schema'], schema) is None


@testrail('C5605')
def test_show_heartbeat(conf, requests_session):
    r = requests_session.get(conf.getoption('server') + '/api/v1/action/')
    r.raise_for_status()
    response = r.json()

    # Verify we have at least one response and then grab the first record
    assert len(response) >= 1

    # Let's find at least one record that is a 'show-heartbeat'
    sh_records = [record for record in response if record['name'] == 'show-heartbeat']

    if len(sh_records) == 0:
        pytest.skip('No show-heartbeat actions found')
        return

    record = sh_records[0]
    expected_action_fields = [
        'name',
        'implementation_url',
        'arguments_schema'
    ]
    for field in record:
        assert field in expected_action_fields

    # Do we have a valid schema for 'arguments_schema'?
    r = requests_session.get(record['arguments_schema']['$schema'])
    r.raise_for_status()
    schema = r.json()
    assert jsonschema.validate(record['arguments_schema'], schema) is None


@testrail('C6570')
def test_recipe_signatures(conf, requests_session):
    r = requests_session.get(conf.getoption('server') + '/api/v1/recipe/signed/')
    r.raise_for_status()
    data = r.json()

    if len(data) == 0:
        pytest.skip('No signed recipes')

    for item in data:
        canonical_recipe = canonicaljson.encode_canonical_json(item['recipe'])
        signature = item['signature']['signature']
        pubkey = item['signature']['public_key']
        assert verify_signature(canonical_recipe, signature, pubkey)
