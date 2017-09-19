/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';

import {
  AddBranchButton,
  BranchFields,
  PreferenceBranches,
  PreferenceExperimentFields,
  RemoveBranchButton,
} from 'control_old/components/action_fields/PreferenceExperimentFields';

describe('<PreferenceExperimentFields>', () => {
  it('should render without errors', () => {
    const wrapper = () => {
      shallow(<PreferenceExperimentFields preferenceBranchType="default" />);
    };

    expect(wrapper).not.toThrow();
  });

  it('should render a warning if using the user preference branch type', () => {
    const wrapper = shallow(<PreferenceExperimentFields preferenceBranchType="user" />);
    expect(wrapper.contains(PreferenceExperimentFields.userBranchWarning)).toBe(true);
  });
});

describe('<PreferenceBranches>', () => {
  it('should render the add button if it is not disabled', () => {
    const wrapper = shallow(<PreferenceBranches fields={[]} />);
    expect(wrapper.find(AddBranchButton).length).toBe(1);
  });

  it('should not render the add button if it is disabled', () => {
    const wrapper = shallow(<PreferenceBranches disabled fields={[]} />);
    expect(wrapper.find(AddBranchButton).length).toBe(0);
  });
});

describe('<BranchFields>', () => {
  it('should render the remove button if it is not disabled', () => {
    const wrapper = shallow(
      <BranchFields branch="branch" onClickDelete={() => {}} preferenceType="string" index={1} />,
    );
    expect(wrapper.find(RemoveBranchButton).length).toBe(1);
  });

  it('should not render the remove button if it is disabled', () => {
    const wrapper = shallow(
      <BranchFields
        branch="branch"
        onClickDelete={() => {}}
        preferenceType="string"
        index={1}
        disabled
      />,
    );
    expect(wrapper.find(RemoveBranchButton).length).toBe(0);
  });
});
