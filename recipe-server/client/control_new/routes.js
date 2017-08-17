import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { routerForBrowser } from 'redux-little-router';

import App from 'control_new/components/App';
import CreateExtensionPage from 'control_new/components/extensions/CreateExtensionPage';
import EditExtensionPage from 'control_new/components/extensions/EditExtensionPage';
import ApprovalHistoryPage from 'control_new/components/recipes/ApprovalHistoryPage';
import CreateRecipePage from 'control_new/components/recipes/CreateRecipePage';
import CloneRecipePage from 'control_new/components/recipes/CloneRecipePage';
import EditRecipePage from 'control_new/components/recipes/EditRecipePage';
import ExtensionListing from 'control_new/components/extensions/ExtensionListing';
import Gateway from 'control_new/components/pages/Gateway';
import RecipeListing from 'control_new/components/recipes/RecipeListing';
import MissingPage from 'control_new/components/pages/MissingPage';
import RecipeDetailPage from 'control_new/components/recipes/RecipeDetailPage';
import ShieldTestPage from 'control_new/components/common/ShieldTestPage';


const routes = {
  '/': {
    component: Gateway,
    crumb: 'Home',
    '/recipe': {
      component: RecipeListing,
      crumb: 'Recipes Listing',
      '/new': {
        component: CreateRecipePage,
        crumb: 'New Recipe',
      },
      '/:recipeId': {
        component: RecipeDetailPage,
        crumb: 'View Recipe',
        '/rev/:revisionId': {
          component: RecipeDetailPage,
          crumb: 'Revision',
          '/clone': {
            component: CloneRecipePage,
            crumb: 'Clone Revision',
          },
        },
        '/edit': {
          component: EditRecipePage,
          crumb: 'Edit Recipe',
        },
        '/approval_history': {
          component: ApprovalHistoryPage,
          crumb: 'Approval History',
        },
        '/clone': {
          component: CloneRecipePage,
          crumb: 'Clone Recipe',
        },
      },
    },
    '/extension': {
      component: ExtensionListing,
      crumb: 'Extensions Listing',
      '/new': {
        component: CreateExtensionPage,
        crumb: 'New Extension',
      },
      '/:extensionId': {
        component: EditExtensionPage,
        crumb: 'Edit Extension',
      },
    },
    '/tests': {
      crumb: 'Tests',
      '/shields': {
        component: ShieldTestPage,
        crumb: 'Shields',
      }
    }
  },
};

export const {
  reducer,
  middleware,
  enhancer,
} = routerForBrowser({
  routes,
  basename: '/control-new',
});

@connect(state => ({
  router: state.router,
}))
export default class Router extends React.Component {
  static propTypes = {
    router: PropTypes.object.isRequired,
  };

  render() {
    const { router } = this.props;
    const content = router.route ? <router.result.component /> : <MissingPage />;
    return <App>{content}</App>;
  }
}
