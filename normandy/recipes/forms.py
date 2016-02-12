import json

from django import forms
from django.core.exceptions import ValidationError

import jsonschema
from jsonschema import SchemaError, ValidationError as JSONValidationError


class ActionAdminForm(forms.ModelForm):
    def clean(self):
        """
        Validate that the action being edited isn't currently in use.
        """
        super().clean()

        if self.instance.in_use:
            self.add_error(
                None,
                ValidationError('Action is currently in use and cannot be edited.')
            )


class RecipeActionInlineForm(forms.ModelForm):
    def clean(self):
        """Validate the arguments against their schema."""
        super().clean()

        schema = self.cleaned_data['action'].arguments_schema
        try:
            arguments = json.loads(self.cleaned_data['arguments_json'])
        except json.JSONDecodeError as err:
            msg = 'Invalid argument JSON: {err}'.format(err=err)
            self.add_error('arguments_json', ValidationError(msg))
            return

        try:
            jsonschema.validate(arguments, schema)
        except (JSONValidationError, SchemaError) as err:
            msg = 'Argument validation failed: {err}'.format(err=err.message)
            self.add_error('arguments_json', ValidationError(msg))
