class ShortCircuitMiddleware(object):
    """
    Middleware that skips remaining middleware when a view is marked with
    normandy.base.decorators.short_circuit_middlewares
    """

    def process_view(self, request, view_func, view_args, view_kwargs):
        if getattr(view_func, 'short_circuit_middlewares', False):
            return view_func(request, *view_args, **view_kwargs)
        else:
            return None
