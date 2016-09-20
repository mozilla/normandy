import React from 'react';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';

import RecipeForm, { DisconnectedRecipeForm } from '../../components/RecipeForm.js';
import controlStore from '../../stores/ControlStore.js';

describe('<RecipeForm>', () => {
  beforeAll(() => {
  });

  it('should work unconnected', () => {
    shallow(<DisconnectedRecipeForm
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
      <RecipeForm params={{}} location={{ query: '' }} />
    </Provider>);
  });

  describe('changeAction', () => {
    let store;
    let recipeFormWrapper;
    let disconnectedFormWrapper;

    beforeEach(() => {
      store = controlStore();
      recipeFormWrapper = mount(<Provider store={store}>
        <RecipeForm params={{}} recipe={{ action: 'show-heartbeat' }} location={{ query: '' }} />
      </Provider>);
      disconnectedFormWrapper = recipeFormWrapper.find('DisconnectedRecipeForm').get(0);
      disconnectedFormWrapper.changeAction({ target: { value: 'console-log' } });
    });

    it('should change the action in state & update the form', () => {
      expect(disconnectedFormWrapper.state.selectedAction).toEqual({ name: 'console-log' });
      expect(recipeFormWrapper.find('ConsoleLogForm').length).toEqual(1);
    });
  });
});
