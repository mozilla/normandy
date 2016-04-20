$('#recipe-list tr').click(function(e) {
  var recipeId = $(this).data('recipe-id');
  window.location = '/control/recipe/' + recipeId + '/';
});

$('.checkbox-container').click(function(e) {
  var inputElem = $(this).siblings('input[type="checkbox"]');
  var currentVal = inputElem.prop('checked');

  inputElem.prop('checked', !currentVal);
  $(this).toggleClass('red green')
  $(this).children('span').toggle();
})
