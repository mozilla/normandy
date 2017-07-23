import { fromJS } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import CurrentUserDetailsWrapper from 'control_new/components/common/CurrentUserDetails';
import { UserFactory } from 'control_new/tests/state';


// Unwrap the connected component
const CurrentUserDetails = CurrentUserDetailsWrapper.WrappedComponent;


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
