from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from normandy.recipes.models import RecipeRevision
from normandy.studies.models import Extension


class ExtensionSerializer(serializers.ModelSerializer):
    xpi = serializers.FileField()

    class Meta:
        model = Extension
        fields = ["id", "name", "xpi", "extension_id", "version", "hash", "hash_algorithm"]
        read_only_fields = ["extension_id", "version", "hash", "hash_algorithm"]

    def is_valid(self, raise_exception=False):
        super().is_valid(raise_exception=raise_exception)

        if "xpi" in self.validated_data:
            try:
                Extension(**self.validated_data).populate_metadata()
            except DjangoValidationError as ex:
                self._validated_data = {}

                for field in ex.message_dict:
                    self._errors.update({field: ex.message_dict[field][0]})

        if self._errors and raise_exception:
            raise ValidationError(self.errors)

        return not bool(self._errors)

    def update(self, instance, validated_data):
        revisions = RecipeRevision.objects.exclude(
            action__name="opt-out-study", latest_for_recipe=None, approved_for_recipe=None
        )

        for r in revisions:
            if r.arguments.get("extensionId") == instance.id:
                raise ValidationError("Extension cannot be updated while in use by a recipe.")

        return super().update(instance, validated_data)
