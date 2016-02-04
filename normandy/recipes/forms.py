import json

from django import forms
from django.core.exceptions import ValidationError

import jsonschema


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
        schema = self.cleaned_data['action'].arguments_schema
        arguments = json.loads(self.cleaned_data['arguments'])

        try:
            jsonschema.validate(arguments, schema)
        except jsonschema.ValidationError as err:
            msg = 'Argument validation failed: {err}'.format(err=err.message)
            self.add_error('arguments', ValidationError(msg))
