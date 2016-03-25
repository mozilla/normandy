from django.shortcuts import render

from normandy.base.admin import site as admin_site
from normandy.classifier.admin.forms import ClientForm
from normandy.classifier.models import Bundle
from normandy.recipes.models import match_sample_rate


@admin_site.register_view('classifier_preview', name='Classifier Preview')
def classifier_preview(request):
    form = ClientForm(request.GET or None)
    if form.is_valid():
        client = form.save()
        bundle = Bundle.for_client(client, exclude=[match_sample_rate])
    else:
        client = None
        bundle = None

    ctx = admin_site.each_context(request)
    ctx.update({
        'form': form,
        'client': client,
        'bundle': bundle,
        'title': 'Classifier Preview'
    })
    return render(request, 'admin/classifier/preview.html', ctx)
