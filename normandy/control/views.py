from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.urlresolvers import reverse_lazy
from django.views import generic

from normandy.recipes.models import Recipe


RECIPE_EDITABLE_FIELDS = ('name', 'action', 'arguments_json', 'enabled', 'locales', 'countries',
                          'start_time', 'end_time', 'sample_rate', 'release_channels',)

class ControlMixin(LoginRequiredMixin):
  login_url = '/control/login/'


class IndexView(ControlMixin, generic.ListView):
  template_name = 'control/index.html'
  context_object_name = 'all_recipes_list'

  def get_queryset(self):
    return Recipe.objects.all().order_by('-enabled')


class EditView(ControlMixin, generic.UpdateView):
  model = Recipe
  fields = RECIPE_EDITABLE_FIELDS
  template_name = 'control/edit_recipe.html'
  success_url = reverse_lazy('control:index')


class CreateView(ControlMixin, generic.CreateView):
  model = Recipe
  fields = RECIPE_EDITABLE_FIELDS
  template_name = 'control/create_recipe.html'
  success_url = reverse_lazy('control:index')


class DeleteView(ControlMixin, generic.DeleteView):
  model = Recipe
  success_url = reverse_lazy('control:index')
  template_name = 'control/delete_recipe.html'
