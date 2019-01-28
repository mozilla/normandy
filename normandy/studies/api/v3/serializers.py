from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from normandy.studies.models import Extension


class ExtensionSerializer(serializers.ModelSerializer):
    xpi = serializers.FileField()

    class Meta:
        model = Extension
        fields = ["id", "name", "xpi", "extension_id", "version", "hash"]
        read_only_fields = ["extension_id", "version", "hash"]

    def is_valid(self, raise_exception=False):
        super().is_valid(raise_exception=raise_exception)

        try:
            Extension(**self.validated_data).populate_metadata()
        except DjangoValidationError as ex:
            self._validated_data = {}

            for field in ex.message_dict:
                self._errors.update({field: ex.message_dict[field][0]})

        if self._errors and raise_exception:
            raise ValidationError(self.errors)

        return not bool(self._errors)
