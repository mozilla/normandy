import configparser
import jsonschema
import pytest
import requests


@pytest.fixture
def conf():
    config = configparser.ConfigParser()
    config.read('manifest.ini')
    return config


def test_recipes(conf, env):
    r = requests.get(conf.get(env, 'api_root') + '/recipe')
    response = r.json()
    expected_fields = [
        'id',
        'last_updated',
        'name',
        'enabled',
        'revision_id',
        'action',
        'arguments',
        'filter_expression',
        'current_approval_request',
        'approval',
        'is_approved'
    ]

    expected_arguments = [
        'defaults',
        'surveyId',
        'surveys'
    ]

    expected_survey_fields = [
        'message',
        'thanksMessage',
        'engagementButtonLabel',
        'title',
        'postAnswerUrl',
        'weight',
        'learnMoreUrl',
        'learnMoreMessage',
    ]

    expected_default_fields = [
        'message',
        'thanksMessage',
        'engagementButtonLabel',
        'postAnswerUrl',
        'learnMoreUrl',
        'learnMoreMessage'
    ]

    # Verify we have at least one response
    assert len(response) >= 1

    # Take a look at the first response and look for the expected fields
    record = response[0]
    for field in expected_fields:
        assert field in record

    # Do the arguments look right?
    for argument in expected_arguments:
        assert argument in record['arguments']

    # Do the defaults look right?
    for field in record['arguments']['defaults']:
        assert field in expected_default_fields

    # Do survey fields look right? Look at the first one
    for field in record['arguments']['surveys'][0]:
        assert field in expected_survey_fields


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
