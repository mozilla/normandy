import jsonschema
import pytest


def test_expected_action_types(conf, requests_session):
    r = requests_session.get(conf.getoption('server') + '/api/v1/action/')
    response = r.json()

    # Verify we have at least one response and then grab the first record
    assert len(response) >= 1

    # Make sure we only have expected action types
    expected_records = ['console-log', 'show-heartbeat']

    for record in response:
        assert record['name'] in expected_records


def test_console_log(conf, requests_session):
    r = requests_session.get(conf.getoption('server') + '/api/v1/action/')
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
    schema = r.json()
    assert jsonschema.validate(record['arguments_schema'], schema) is None


def test_show_heartbeat(conf, requests_session):
    r = requests_session.get(conf.getoption('server') + '/api/v1/action')
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
    schema = r.json()
    assert jsonschema.validate(record['arguments_schema'], schema) is None
