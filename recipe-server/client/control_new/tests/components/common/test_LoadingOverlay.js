import { fromJS } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import LoadingOverlay, {SimpleLoadingOverlay} from 'control_new/components/common/LoadingOverlay';

describe('<SimpleLoadingOverlay>', () => {
  const props = {
    children: <div>Hello world!</div>,
    isVisible: false,
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<SimpleLoadingOverlay {...props} />);

    expect(wrapper).not.toThrow();
  });
});
