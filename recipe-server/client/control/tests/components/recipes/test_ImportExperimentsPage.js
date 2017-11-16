import React from 'react';
import { Card, Modal } from 'antd';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';

import ExperimentFactory from 'control/tests/state/experimenter';
import LoadingOverlay from 'control/components/common/LoadingOverlay';
import QueryExperiments from 'control/components/data/QueryExperiments';
import ImportExperimentsPage, {
  ExperimentAcceptButton,
  ExperimentRejectButton,
  ExperimentButtons,
  ExperimentTitle,
  Experiment,
  ExperimentRejectModal,
  ExperimentsList,
} from 'control/components/recipes/ImportExperimentsPage';

describe('<ImportExperimentsPage>', () => {
  it('should work', () => {
    const wrapper = () => shallow(<ImportExperimentsPage />);
    expect(wrapper).not.toThrow();
  });

  it('should contain QueryExperiments', () => {
    const wrapper = shallow(<ImportExperimentsPage />);
    expect(wrapper.contains(<QueryExperiments />)).toBeTruthy();
  });

  it('should contain LoadingOverlay', () => {
    const wrapper = shallow(<ImportExperimentsPage />);
    expect(wrapper.find(LoadingOverlay).length).toEqual(1);
  });

  it('should contain ExperimentRejectModal', () => {
    const wrapper = shallow(<ImportExperimentsPage />);
    expect(wrapper.contains(<ExperimentRejectModal />)).toBeTruthy();
  });

  it('should contain ExperimentsList', () => {
    const wrapper = shallow(<ImportExperimentsPage />);
    expect(wrapper.contains(<ExperimentsList />)).toBeTruthy();
  });
});

describe('<ExperimentsList>', () => {
  const props = {
    experiments: fromJS(ExperimentFactory.buildMany(3)),
  };

  it('should work', () => {
    const wrapper = () => shallow(<ExperimentsList.WrappedComponent {...props} />);
    expect(wrapper).not.toThrow();
  });

  it('should contain Experiments', () => {
    const wrapper = shallow(<ExperimentsList.WrappedComponent {...props} />);
    expect(wrapper.find(Experiment).length).toEqual(props.experiments.size);
  });
});

describe('<ExperimentRejectModal>', () => {
  const props = {
    rejectExperiment: () => {},
    rejectedExperiment: null,
    selectRejectedExperiment: () => {},
  };

  it('should work', () => {
    const wrapper = () => shallow(<ExperimentRejectModal.WrappedComponent {...props} />);
    expect(wrapper).not.toThrow();
  });

  it('should not contain a Modal if no rejectedExperiment is set', () => {
    const wrapper = shallow(<ExperimentRejectModal.WrappedComponent {...props} />);
    expect(wrapper.find(Modal).length).toEqual(0);
  });

  it('should contain a Modal if rejectedExperiment is set', () => {
    const testProps = {
      rejectExperiment: () => {},
      rejectedExperiment: ExperimentFactory.build(),
      selectRejectedExperiment: () => {},
    };

    const wrapper = shallow(<ExperimentRejectModal.WrappedComponent {...testProps} />);
    expect(wrapper.find(Modal).length).toEqual(1);
  });

  it('should store the rejection reason in its state when edited', () => {
    const reason = 'rejected for reasons.';
    const wrapper = shallow(<ExperimentRejectModal.WrappedComponent {...props} />);
    wrapper.instance().handleReasonChange({ target: { value: reason } });
    expect(wrapper.state().reason).toEqual(reason);
  });

  it('should selectRejectedExperiment with null when canceled', () => {
    const testProps = {
      rejectExperiment: () => {},
      rejectedExperiment: null,
      selectRejectedExperiment: newRejectedExperiment => {
        expect(newRejectedExperiment).toEqual(null);
      },
    };

    const wrapper = shallow(<ExperimentRejectModal.WrappedComponent {...testProps} />);
    wrapper.instance().handleCancel();
  });

  it('should call rejectExperiment with a reason when rejected', () => {
    const reason = 'rejected for reasons.';
    const experiment = ExperimentFactory.build();
    const rejectExperiment = jasmine.createSpy();

    const testProps = {
      rejectExperiment,
      rejectedExperiment: experiment,
      selectRejectedExperiment: () => {},
    };

    const wrapper = shallow(<ExperimentRejectModal.WrappedComponent {...testProps} />);
    wrapper.setState({ reason });
    wrapper.instance().handleReject();

    expect(rejectExperiment).toHaveBeenCalled();

    const [calledExperiment, calledReason] = testProps.rejectExperiment.calls.all()[0].args;
    expect(calledExperiment.slug).toEqual(experiment.slug);
    expect(calledReason).toEqual(reason);
  });
});

describe('<Experiment>', () => {
  const experiment = ExperimentFactory.build();
  const props = { experiment };

  it('should work', () => {
    const wrapper = () => shallow(<Experiment {...props} />);
    expect(wrapper).not.toThrow();
  });

  it('should contain a Card', () => {
    const wrapper = shallow(<Experiment {...props} />);
    expect(wrapper.find(Card).length).toEqual(1);
  });
});

describe('<ExperimentTitle>', () => {
  const experiment = ExperimentFactory.build();
  const props = { experiment };

  it('should work', () => {
    const wrapper = () => shallow(<ExperimentTitle {...props} />);
    expect(wrapper).not.toThrow();
  });
});

describe('<ExperimentButtons>', () => {
  const experiment = ExperimentFactory.build();
  const props = { experiment };

  it('should work', () => {
    const wrapper = () => shallow(<ExperimentButtons {...props} />);
    expect(wrapper).not.toThrow();
  });

  it('should contain an ExperimentAcceptButton', () => {
    const wrapper = shallow(<ExperimentButtons {...props} />);
    expect(wrapper.contains(<ExperimentAcceptButton {...props} />)).toBeTruthy();
  });

  it('should contain an ExperimentRejectButton', () => {
    const wrapper = shallow(<ExperimentButtons {...props} />);
    expect(wrapper.contains(<ExperimentRejectButton {...props} />)).toBeTruthy();
  });
});

describe('<ExperimentAcceptButton>', () => {
  const experiment = ExperimentFactory.build();
  const props = {
    experiment,
    importExperiment: () => {},
  };

  it('should work', () => {
    const wrapper = () => shallow(<ExperimentAcceptButton.WrappedComponent {...props} />);
    expect(wrapper).not.toThrow();
  });

  it('should call importExperiment with provided experiment when clicked', () => {
    const importExperiment = jasmine.createSpy();

    const testProps = {
      experiment,
      importExperiment,
    };

    const wrapper = shallow(<ExperimentAcceptButton.WrappedComponent {...testProps} />);
    wrapper.instance().handleClick();

    expect(importExperiment).toHaveBeenCalled();

    const [calledExperiment] = importExperiment.calls.all()[0].args;
    expect(calledExperiment.slug).toEqual(experiment.slug);
  });
});

describe('<ExperimentRejectButton>', () => {
  const experiment = ExperimentFactory.build();
  const props = {
    experiment,
    selectRejectedExperiment: () => {},
  };

  it('should work', () => {
    const wrapper = () => shallow(<ExperimentRejectButton.WrappedComponent {...props} />);
    expect(wrapper).not.toThrow();
  });

  it('should call selectRejectedExperiment with provided experiment when clicked', () => {
    const selectRejectedExperiment = jasmine.createSpy();

    const testProps = {
      experiment,
      selectRejectedExperiment,
    };

    const wrapper = shallow(<ExperimentRejectButton.WrappedComponent {...testProps} />);
    wrapper.instance().handleClick();

    expect(selectRejectedExperiment).toHaveBeenCalled();

    const [calledExperiment] = selectRejectedExperiment.calls.all()[0].args;
    expect(calledExperiment.slug).toEqual(experiment.slug);
  });
});
