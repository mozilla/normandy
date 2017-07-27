import React from 'react';
import { shallow, mount } from 'enzyme';

import TestComponent from 'control/components/data/QueryExperiments';

const { WrappedComponent: QueryExperiments } = TestComponent;


describe('<QueryExperiments>', () => {
  const props = {
    fetchExperiments: jasmine.createSpy(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<QueryExperiments {...props} />);

    expect(wrapper).not.toThrow();
  });

  it('should call fetchExperiments on componentWillReceiveProps', () => {
    const experimenterAPIUrl = 'https://example.com/api/v1';
    const fetchExperiments = jasmine.createSpy();
    const component = mount(<QueryExperiments fetchExperiments={fetchExperiments} />);

    component.setProps({
      fetchExperiments,
      experimenterAPIUrl,
    });

    expect(fetchExperiments).toHaveBeenCalledWith(experimenterAPIUrl);
  });

  it('should not render anything', () => {
    const wrapper = shallow(<QueryExperiments {...props} />);
    expect(wrapper.children().length).toBe(0);
  });
});
