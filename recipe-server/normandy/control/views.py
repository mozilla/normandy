from django.shortcuts import render, redirect


def IndexView(request):
    if not request.user.is_authenticated():
        return redirect('%s?next=%s' % ('/control/login/', request.path))
    else:
        return render(request, 'control/index.html')
