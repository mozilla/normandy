import configparser
import jsonschema
import pytest
import requests


@pytest.fixture
def conf():
    config = configparser.ConfigParser()
    config.read('manifest.ini')
    return config


def filter_show_heartbeat(record):
    return record['name'] == 'show-heartbeat'


def filter_console_log(record):
    return record['name'] == 'console-log'


def test_expected_action_types(conf, env):
    r = requests.get(conf.get(env, 'api_root') + '/action')
    response = r.json()

    # Verify we have at least one response and then grab the first record
    assert len(response) >= 1

    # Make sure we only have expected action types
    expected_records = ['console-log', 'show-heartbeat']

    for record in response:
        assert record['name'] in expected_records


def test_console_log(conf, env):
    r = requests.get(conf.get(env, 'api_root') + '/action')
    response = r.json()

    # Verify we have at least one response and then grab the first record
    assert len(response) >= 1

    # Look for any console-log actions
    cl_records = list(filter(filter_console_log, response))

    if len(cl_records) == 0:
        pytest.skip('No console-log actions found')
    else:
        console_log_test(cl_records[0])


def test_show_heartbeat(conf, env):
    r = requests.get(conf.get(env, 'api_root') + '/action')
    response = r.json()

    # Verify we have at least one response and then grab the first record
    assert len(response) >= 1

    # Let's find at least one record that is a 'show-heartbeat'
    sh_records = list(filter(filter_show_heartbeat, response))

    if len(sh_records) == 0:
        pytest.skip('No show-heartbeat actions found')
    else:
        show_hearbeat_test(sh_records[0])


def show_hearbeat_test(record):
    expected_action_fields = [
        'name',
        'implementation_url',
        'arguments_schema'
    ]
    for field in record:
        assert field in expected_action_fields

    # Do we have a valid schema for 'arguments_schema'?
    r = requests.get(record['arguments_schema']['$schema'])
    schema = r.json()
    assert jsonschema.validate(record['arguments_schema'], schema) is None


def console_log_test(record):
    # Does an 'action' have all the required fields?
    expected_action_fields = [
        'name',
        'implementation_url',
        'arguments_schema'
    ]
    for field in record:
        assert field in expected_action_fields

    # Do we have a valid schema for 'arguments_schema'?
    r = requests.get(record['arguments_schema']['$schema'])
    schema = r.json()
    assert jsonschema.validate(record['arguments_schema'], schema) is None
