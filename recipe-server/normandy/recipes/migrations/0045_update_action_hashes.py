# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import hashlib
from base64 import urlsafe_b64encode

from django.db import migrations


def make_hashes_urlsafe_sri(apps, schema_editor):
    Action = apps.get_model('recipes', 'Action')

    for action in Action.objects.all():
        data = action.implementation.encode()
        digest = hashlib.sha384(data).digest()
        data_hash = urlsafe_b64encode(digest)
        action.implementation_hash = 'sha384-' + data_hash.decode()
        action.save()


def make_hashes_sha1(apps, schema_editor):
    Action = apps.get_model('recipes', 'Action')

    for action in Action.objects.all():
        data = action.implementation.encode()
        data_hash = hashlib.sha1(data).hexdigest()
        action.implementation_hash = data_hash
        action.save()


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0044_auto_20170801_0010'),
    ]

    operations = [
        migrations.RunPython(make_hashes_urlsafe_sri, make_hashes_sha1),
    ]
