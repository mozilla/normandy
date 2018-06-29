#!/usr/bin/env python
import os
import sys

import configurations


# Setup Django stuff.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "normandy.settings")
configurations.setup()

from django.contrib.auth.models import User  # noqa

User.objects.create_superuser("user1", "user1@example.com", "testpass")
print('Created admin user "user1".')

User.objects.create_superuser("user2", "user2@example.com", "testpass")
print('Created admin user "user2".')
