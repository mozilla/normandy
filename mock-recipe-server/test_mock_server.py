"""
Tests for the mock-server itself.
"""


def test_testcase_difference(root_path):
    """Ensure that different testcases output different data."""
    console_log_recipes = root_path.add('ConsoleLogBasic', 'api', 'v1', 'recipe', 'signed').read()
    filter_channel_recipes = root_path.add('FilterChannel', 'api', 'v1', 'recipe', 'signed').read()
    assert console_log_recipes != filter_channel_recipes
