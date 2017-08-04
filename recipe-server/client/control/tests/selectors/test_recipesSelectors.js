import * as recipesSelectors from 'control/selectors/RecipesSelector';

import {
  fixtureRecipes,
  fixtureRecipeDict,
  fixtureStoredRevisions,
} from '../fixtures';


const fixtureApprovedRevisions = {
  abc: {
    id: 'abc',
    approval_request: {
      approved: true,
      created: Date.now() - 1000,
    },
  },
  def: {
    id: 'def',
    approval_request: {
      approved: true,
      created: Date.now() - 500,
    },
  },
  ghi: {
    id: 'ghi',
    approval_request: {
      created: Date.now() - 250,
    },
  },
};


describe('Recipe Selectors', () => {
  it('getLastApprovedRevision', () => {
    const revisions = { ...fixtureApprovedRevisions };

    // expect the last approved to be the most recent, accepted revision
    let lastApproved = recipesSelectors.getLastApprovedRevision(revisions);
    expect(lastApproved.id).toBe('def');

    // update the latest approved
    revisions.ghi.approval_request.approved = true;

    // selector should reflect the change
    lastApproved = recipesSelectors.getLastApprovedRevision(revisions);
    expect(lastApproved.id).toBe('ghi');
  });

  it('getSelectedRevision', () => {
    const revisions = {
      1: {
        abc: {
          id: 1,
          name: 'Lorem Ipsum',
          enabled: true,
          revision_id: 'abc',
          recipe: fixtureRecipes[0],
        },
      },
      2: {
        def: {
          id: 2,
          name: 'Dolor set amet',
          enabled: true,
          revision_id: 'def',
          recipe: fixtureRecipes[1],
        },
      },
    };

    const state = {
      recipes: {
        entries: fixtureRecipeDict,
        revisions,
        selectedRecipe: 1,
        selectedRevision: 'abc',
      },
    };

    expect(recipesSelectors.getSelectedRevision(state)).toEqual({
      recipe: fixtureRecipes[0],
      revision: fixtureStoredRevisions[1].abc.recipe,
    });
  });
});
