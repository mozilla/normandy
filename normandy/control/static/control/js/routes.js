import React from 'react';
import { Route } from 'react-router';
import ControlApp from './components/ControlApp.jsx';
import RecipeList from './components/RecipeList.jsx';
import RecipeForm from './components/RecipeForm.jsx';
import RecipeHistory from './components/RecipeHistory.jsx';
import RecipePreview from './components/RecipePreview.jsx';
import DeleteRecipe from './components/DeleteRecipe.jsx';
import ApprovalRequestList from './components/ApprovalRequestList.jsx';
import ApprovalRequestDetails from './components/ApprovalRequestDetails.jsx';

export default (
  <Route component={ControlApp}>
    <Route path='control/'
      component={RecipeList}
      ctaButtons={[
        {text: 'Add New', icon: 'plus', link: 'recipe/new/'}
      ]}
    />
    <Route path='control/recipe/new/'
      component={RecipeForm}
      pageTitle="Add New Recipe"
    />
    <Route path='control/recipe/:id/'
      component={RecipeForm}
      pageTitle="Edit Recipe"
      ctaButtons={[
        {text: 'Preview', icon: 'eye', link: 'preview/'},
        {text: 'Approval Requests', icon: '', link: 'requests/'},
        {text: 'History', icon: 'history', link: 'history/'},
      ]}
    />
    <Route path='control/recipe/:id/preview/'
      component={RecipePreview}
      pageTitle="Preview Recipe"
    />
    <Route path='control/recipe/:id/history/'
      component={RecipeHistory}
      pageTitle="History"
    />
    <Route
      path='control/recipe/:id/delete/'
      component={DeleteRecipe}
      pageTitle="Delete Recipe"
    />
    <Route
      path='control/recipe/:recipeId/requests/'
      component={ApprovalRequestList}
    />
    <Route
      path='control/recipe/:recipeId/requests/:approvalRequestId/'
      component={ApprovalRequestDetails}
      pageTitle="Approval Request"
    />
  </Route>
);
