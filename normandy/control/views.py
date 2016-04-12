from django.views import generic
from django.contrib.auth.mixins import LoginRequiredMixin

from normandy.recipes.models import Recipe


class ControlMixin(LoginRequiredMixin):
  login_url = '/control/login/'


class IndexView(ControlMixin, generic.ListView):
  template_name = 'control/index.html'
  context_object_name = 'all_recipes_list'

  def get_queryset(self):
    return Recipe.objects.all()


class EditView(ControlMixin, generic.DetailView):
  model = Recipe
  template_name = 'control/edit_recipe.html'
