import json

from django.db import transaction

from product_details.storage import PDDatabaseStorage


class ProductDetailsRelationalStorage(PDDatabaseStorage):
    """
    Extends the in-database storage for product_details to provide a
    database table of locales for other models to have foreign keys to.
    """
    @transaction.atomic
    def update(self, name, content, last_modified):
        # Don't import models when module loads due to app startup.
        from normandy.recipes.models import Locale

        super().update(name, content, last_modified)

        # If we are updating firefox versions, update the table.
        if name == 'languages.json':
            languages = json.loads(content)
            for locale_code, names in languages.items():
                Locale.objects.update_or_create(code=locale_code, defaults={
                    'name': names['English'],
                })

            # Remove obsolete locales.
            Locale.objects.exclude(code__in=languages.keys()).delete()
