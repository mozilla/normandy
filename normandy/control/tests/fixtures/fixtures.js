export const fixtureRecipes = [
  { "id": 1, "name": "Lorem Ipsum", "enabled": true },
  { "id": 2, "name": "Dolor set amet", "enabled": true },
  { "id": 3, "name": "Consequitar adipscing", "enabled": false }
];

export const initialState = {
  recipes: null,
  isFetching: false,
  selectedRecipe: null,
  recipeListNeedsFetch: true,
  notification: null
};

export const fixtureRevisions = [
  {
    "id": 169,
    "date_created": "2016-05-13T17:20:35.698735Z",
    "recipe": {
        "id": 36,
        "name": "Consequestar",
        "enabled": true,
        "revision_id": 22,
        "action_name": "console-log",
        "arguments": {
            "message": "hi there message here"
        },
        "filter_expression": "()",
        "approver": null,
        "is_approved": false
    }
  }
];
