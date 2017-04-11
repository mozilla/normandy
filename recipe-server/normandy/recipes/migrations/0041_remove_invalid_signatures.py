"""
Removes signatures, so they can be easily recreated during deployment.

This migration is intended to be used between "eras" of signatures. As
the serialization format of recipes changes, the signatures need to
also change. This could be handled automatically, but it is easier to
deploy if we just remove everything in a migration, and allow the
normal processes to regenerate the signatures.
"""

# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


def remove_signatures(apps, schema_editor):
    Recipe = apps.get_model('recipes', 'Recipe')
    Signature = apps.get_model('recipes', 'Signature')

    for recipe in Recipe.objects.exclude(signature=None):
        sig = recipe.signature
        recipe.signature = None
        recipe.save()
        sig.delete()

    for sig in Signature.objects.all():
        sig.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0040_approvalrequest_comment'),
    ]

    operations = [
        # This function as both a forward and reverse migration
        migrations.RunPython(remove_signatures, remove_signatures),
    ]
