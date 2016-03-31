from django.views import generic
from django.contrib.auth.mixins import LoginRequiredMixin

from normandy.recipes.models import Recipe


class IndexView(LoginRequiredMixin, generic.ListView):
  template_name = 'control/index.html'
  context_object_name = 'all_recipes_list'
  login_url = '/control/login/'

  def get_queryset(self):
    return Recipe.objects.order_by('-start_time')[:5]


class EditView(LoginRequiredMixin, generic.DetailView):
  model = Recipe
  template_name = 'control/edit_recipe.html'
  login_url = '/control/login/'
