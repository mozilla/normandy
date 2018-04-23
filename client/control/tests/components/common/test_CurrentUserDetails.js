import { fromJS } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import { UserFactory } from 'control/tests/state/users';

import TestComponent from 'control/components/common/CurrentUserDetails';

const { WrappedComponent: CurrentUserDetails } = TestComponent;

describe('<CurrentUserDetails>', () => {
  const props = {
    logoutUrl: '/logout/',
    user: fromJS(UserFactory.build()),
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<CurrentUserDetails {...props} />);

    expect(wrapper).not.toThrow();
  });
});
