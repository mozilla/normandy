from django.conf.urls import url

from normandy.capabilities.api.v3 import views


app_name = "capabilities"

urlpatterns = [url(r"^capabilities/", views.CapabilitiesView.as_view(), name="capabilities")]
