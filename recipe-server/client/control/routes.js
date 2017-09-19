import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { routerForBrowser } from 'redux-little-router';

import App from 'control/components/App';
import CreateExtensionPage from 'control/components/extensions/CreateExtensionPage';
import EditExtensionPage from 'control/components/extensions/EditExtensionPage';
import ApprovalHistoryPage from 'control/components/recipes/ApprovalHistoryPage';
import CreateRecipePage from 'control/components/recipes/CreateRecipePage';
import CloneRecipePage from 'control/components/recipes/CloneRecipePage';
import EditRecipePage from 'control/components/recipes/EditRecipePage';
import ExtensionListing from 'control/components/extensions/ExtensionListing';
import Gateway from 'control/components/pages/Gateway';
import RecipeListing from 'control/components/recipes/RecipeListing';
import MissingPage from 'control/components/pages/MissingPage';
import RecipeDetailPage from 'control/components/recipes/RecipeDetailPage';


const routes = {
  '/': {
    component: Gateway,
    crumb: 'Home',
    '/recipe': {
      '/': {
        component: RecipeListing,
        crumb: 'Recipes Listing',
      },
      '/new': {
        '/': {
          component: CreateRecipePage,
          crumb: 'New Recipe',
        }
      },
      '/:recipeId': {
        '/': {
          component: RecipeDetailPage,
          crumb: 'View Recipe',
        },
        '/rev/:revisionId': {
          '/': {
            component: RecipeDetailPage,
            crumb: 'Revision',
          },
          '/clone': {
            '/': {
              component: CloneRecipePage,
              crumb: 'Clone Revision',
            },
          },
        },
        '/edit': {
          '/': {
            component: EditRecipePage,
            crumb: 'Edit Recipe',
          },
        },
        '/approval_history': {
          '/': {
            component: ApprovalHistoryPage,
            crumb: 'Approval History',
          },
        },
        '/clone': {
          '/': {
            component: CloneRecipePage,
            crumb: 'Clone Recipe',
          },
        },
      },
    },
    '/extension': {
      '/': {
        component: ExtensionListing,
        crumb: 'Extensions Listing',
      },
      '/new': {
        '/': {
          component: CreateExtensionPage,
          crumb: 'New Extension',
        },
      },
      '/:extensionId': {
        '/': {
          component: EditExtensionPage,
          crumb: 'Edit Extension',
        },
      },
    },
  },
};

export const {
  reducer,
  middleware,
  enhancer,
} = routerForBrowser({
  routes,
  basename: '',
});

@connect(state => ({
  router: state.router,
}))
export default class Router extends React.PureComponent {
  static propTypes = {
    router: PropTypes.object.isRequired,
  };

  render() {
    const { router } = this.props;
    const content = router.route ? <router.result.component /> : <MissingPage />;
    return <App>{content}</App>;
  }
}
