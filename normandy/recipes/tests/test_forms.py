from django.forms import modelform_factory

import pytest

from normandy.recipes.forms import ActionAdminForm, RecipeActionInlineForm
from normandy.recipes.models import Action, RecipeAction
from normandy.recipes.tests import ActionFactory, RecipeActionFactory


@pytest.mark.django_db()
def test_action_admin_form_in_use():
    """Actions that are in-use cannot be edited."""
    action = RecipeActionFactory(recipe__enabled=True).action

    FormClass = modelform_factory(Action, form=ActionAdminForm, fields=['name'])
    form = FormClass({'name': 'foo'}, instance=action)
    assert not form.is_valid()
    assert len(form.non_field_errors()) == 1


@pytest.mark.django_db()
def test_action_admin_form_not_in_use():
    """Actions that are not in-use can be edited."""
    action = RecipeActionFactory(recipe__enabled=False).action

    FormClass = modelform_factory(Action, form=ActionAdminForm, fields=['name'])
    form = FormClass({'name': 'foo'}, instance=action)
    assert form.is_valid()


@pytest.mark.django_db()
class TestRecipeActionInlineForm(object):
    FormClass = modelform_factory(
        RecipeAction,
        form=RecipeActionInlineForm,
        fields=['action', 'arguments_json']
    )

    def test_invalid_json(self):
        action = ActionFactory()
        form = self.FormClass({
            'action': action.id,
            'arguments_json': '{infval32t:3}}}'
        })
        assert not form.is_valid()
        assert len(form.errors['arguments_json']) == 1

    def test_invalid_schema(self):
        action = ActionFactory(arguments_schema={'required': 'invalid'})
        form = self.FormClass({
            'action': action.id,
            'arguments_json': '{"valid": "json"}'
        })
        assert not form.is_valid()
        assert len(form.errors['arguments_json']) == 1

    def test_arguments_dont_match_schema(self):
        action = ActionFactory(arguments_schema={
            'required': ['foo'],
            'foo': {'type': 'string'}
        })

        form = self.FormClass({
            'action': action.id,
            'arguments_json': '{"doesnt": "match"}'
        })

        assert not form.is_valid()
        assert len(form.errors['arguments_json']) == 1

    def test_arguments_match_schema(self):
        action = ActionFactory(arguments_schema={
            'required': ['foo'],
            'foo': {'type': 'string'}
        })

        form = self.FormClass({
            'action': action.id,
            'arguments_json': '{"foo": "bar"}'
        })

        assert form.is_valid()
