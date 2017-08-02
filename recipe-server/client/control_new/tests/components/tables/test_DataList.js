import { List } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/tables/DataList';

const { WrappedComponent: DataList } = TestComponent;

describe('<DataList>', () => {
  const props = {
    columnRenderers: {},
    columns: new List(),
    dataSource: [],
    getCurrentURL: () => {},
    ordering: 'surprise-me',
    onRowClick: () => {},
    push: () => {},
  };

  it('should work', () => {
    const wrapper = () => shallow(<DataList {...props} />);

    expect(wrapper).not.toThrow();
  });
});
