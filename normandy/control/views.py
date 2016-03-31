from django.views import generic

from normandy.recipes.models import Recipe


class IndexView(generic.ListView):
  template_name = 'control/index.html'
  context_object_name = 'all_recipes_list'

  def get_queryset(self):
    return Recipe.objects.order_by('-start_time')[:5]


class EditView(generic.DetailView):
  model = Recipe
  template_name = 'control/edit_recipe.html'
