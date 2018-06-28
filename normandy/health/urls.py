from django.conf.urls import url

from normandy.health.api import views

app_name = "health"

urlpatterns = [url(r"^__cspreport__", views.cspreport, name="cspreport")]
