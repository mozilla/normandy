import json

from django import forms
from django.core.exceptions import ValidationError

import jsonschema
from jsonschema import SchemaError, ValidationError as JSONValidationError


class RecipeAdminForm(forms.ModelForm):
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

    class Media:
        css = {
            'all': ('npm/font-awesome/css/font-awesome.css', 'css/arguments_editor.css')
        }
        js = ('npm/json-editor/dist/jsoneditor.js', 'js/arguments_editor.js')
