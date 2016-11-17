import React from 'react';
import { IndexRedirect, IndexRoute, Route } from 'react-router';
import ControlApp from 'control/components/ControlApp';
import RecipeList from 'control/components/RecipeList';
import RecipeForm from 'control/components/RecipeForm';
import RecipeHistory from 'control/components/RecipeHistory';
import RecipePreview from 'control/components/RecipePreview';
import DeleteRecipe from 'control/components/DeleteRecipe';
import NoMatch from 'control/components/NoMatch';

export default (
  <Route path="/control/" component={ControlApp}>
    <IndexRedirect to="recipe/" />
    <Route path="recipe/" name="Recipes">
      <IndexRoute
        component={RecipeList}
        ctaButtons={[
          { text: 'Add New', icon: 'plus', link: 'new/' },
        ]}
      />
      <Route
        path="new/"
        component={RecipeForm}
        name="Add New"
      />
      <Route path=":id/" name="Recipe">
        <IndexRoute
          component={RecipeForm}
          ctaButtons={[
            { text: 'Preview', icon: 'eye', link: 'preview/' },
            { text: 'History', icon: 'history', link: 'history/' },
          ]}
        />
        <Route
          path="preview/"
          component={RecipePreview}
          name="Preview"
        />
        <Route
          path="history/"
          component={RecipeHistory}
          name="History"
        />
        <Route
          path="delete/"
          component={DeleteRecipe}
          name="Delete"
        />
      </Route>
    </Route>
    <Route path="*" component={NoMatch} />
  </Route>
);
