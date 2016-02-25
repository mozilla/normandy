from django.contrib.auth.admin import GroupAdmin, UserAdmin
from django.contrib.auth.models import Group, User

from adminplus.sites import AdminSitePlus
from rest_framework.authtoken.admin import TokenAdmin
from rest_framework.authtoken.models import Token


site = AdminSitePlus()

site.site_header = 'SHIELD Server Admin'
site.site_title = 'SHIELD Server Admin'


# Register third-party apps.
site.register(Group, GroupAdmin)
site.register(User, UserAdmin)
site.register(Token, TokenAdmin)
