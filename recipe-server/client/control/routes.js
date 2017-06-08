import React from 'react';
import { IndexRedirect, IndexRoute, Route } from 'react-router';
import ControlApp from 'control/components/ControlApp';
import ExtensionList from 'control/components/ExtensionList';
import RecipeList from 'control/components/RecipeList';
import RecipeForm from 'control/components/RecipeForm';
import RecipeHistory from 'control/components/RecipeHistory';
import RecipePreview from 'control/components/RecipePreview';
import DeleteRecipe from 'control/components/DeleteRecipe';
import EnableRecipe from 'control/components/EnableRecipe';
import DisableRecipe from 'control/components/DisableRecipe';
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
          name="Latest"
          component={RecipeForm}
          ctaButtons={[
            { text: 'Clone', icon: 'files-o', link: 'clone/' },
            { text: 'Preview', icon: 'eye', link: 'preview/' },
            { text: 'History', icon: 'history', link: 'history/' },
          ]}
        />
        <Route
          path="revision/:revisionId"
          component={RecipeForm}
          name="Revision"
          ctaButtons={[
            { text: 'Clone', icon: 'files-o', link: '../../clone/' },
            { text: 'Preview', icon: 'eye', link: '../../preview/' },
            { text: 'History', icon: 'history', link: '../../history/' },
          ]}
        />
        <Route
          path="clone/"
          component={RecipeForm}
          name="Clone"
          isCloning
          ctaButtons={[
            { text: 'Cancel', icon: 'ban', link: '../' },
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
        <Route
          path="enable/"
          component={EnableRecipe}
          name="Enable"
        />
        <Route
          path="disable/"
          component={DisableRecipe}
          name="Disable"
        />
        <Route
          path=":revisionId/"
          component={RecipeForm}
          ctaButtons={[
            { text: 'History', icon: 'history', link: '../history/' },
          ]}
        />
      </Route>
    </Route>
    <Route path="extension/" name="Extensions">
      <IndexRoute
        component={ExtensionList}
        ctaButtons={[
          { text: 'Add New', icon: 'plus', link: 'new/' },
        ]}
      />
    </Route>
    <Route path="*" component={NoMatch} />
  </Route>
);
