#!/usr/bin/env python
import os
import sys

import configurations


# Setup Django stuff.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "normandy.settings")
configurations.setup()

from django.contrib.auth.models import User  # noqa
User.objects.create_superuser('admin', 'admin@example.com', 'asdfqwer')
print('Created admin user "admin".')
