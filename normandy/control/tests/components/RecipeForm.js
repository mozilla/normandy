import React from 'react';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';

import ConnectedRecipeForm, { RecipeForm } from '../../static/control/js/components/RecipeForm.js';
import controlStore from '../../static/control/js/stores/ControlStore.js';

describe('<RecipeForm>', () => {
  beforeAll(() => {
  });

  it('should work unconnected', () => {
    shallow(<RecipeForm
      dispatch={() => {}}
      fields={{}}
      formState={{}}
      recipeId={0}
      submitting={false}
      recipe={{}}
      handleSubmit={() => {}}
      viewingRevision={false}
    />);
  });

  it('should work connected', () => {
    const store = controlStore();
    mount(<Provider store={store}>
      <ConnectedRecipeForm params={{}} location={{ query: '' }} />
    </Provider>);
  });
});
