import { List } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control/components/recipes/HistoryTimeline';

const { WrappedComponent: HistoryTimeline } = TestComponent;

describe('<HistoryTimeline>', () => {
  const props = {
    history: new List(),
    isLatestRevision: () => {},
    recipeId: 123,
    selectedRevisionId: 'abc',
  };

  it('should work', () => {
    const wrapper = () => shallow(<HistoryTimeline {...props} />);

    expect(wrapper).not.toThrow();
  });
});
