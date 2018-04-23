import React, { PropTypes as pt } from 'react';
import autobind from 'autobind-decorator';
import immutable from 'immutable';
import { Row, Col, Button, Card, Modal } from 'antd';
import { connect } from 'react-redux';


import LoadingOverlay from 'control/components/common/LoadingOverlay';
import QueryExperiments from 'control/components/data/QueryExperiments';
import { importExperiment, selectRejectedExperiment, rejectExperiment } from 'control/state/app/experimenter/actions';
import { getActionByName } from 'control/state/app/actions/selectors';
import { getExperiments, getRejectedExperiment } from 'control/state/app/experimenter/selectors';


@connect(
  state => ({
    prefAction: getActionByName(state, 'preference-experiment'),
  }),
  { importExperiment },
)
@autobind
export class ExperimentAcceptButton extends React.PureComponent {
  static propTypes = {
    experiment: pt.instanceOf(immutable.Map).isRequired,
    importExperiment: pt.func.isRequired,
    prefAction: pt.instanceOf(immutable.Map),
  };

  static defaultProps = {
    prefAction: null,
  };

  handleClick() {
    this.props.importExperiment(this.props.experiment, this.props.prefAction);
  }

  render() {
    return (
      <Button type="primary" onClick={this.handleClick}>Accept</Button>
    );
  }
}

@connect(null, { selectRejectedExperiment })
@autobind
export class ExperimentRejectButton extends React.PureComponent {
  static propTypes = {
    experiment: pt.instanceOf(immutable.Map).isRequired,
    selectRejectedExperiment: pt.func.isRequired,
  };

  handleClick() {
    this.props.selectRejectedExperiment(this.props.experiment);
  }

  render() {
    return (
      <Button type="danger" onClick={this.handleClick}>Reject</Button>
    );
  }
}


export class ExperimentButtons extends React.PureComponent {
  static propTypes = {
    experiment: pt.instanceOf(immutable.Map).isRequired,
  };

  render() {
    return (
      <div>
        <ExperimentAcceptButton experiment={this.props.experiment} />
        <ExperimentRejectButton experiment={this.props.experiment} />
      </div>
    );
  }
}


export class ExperimentTitle extends React.PureComponent {
  static propTypes = {
    experiment: pt.instanceOf(immutable.Map).isRequired,
  };

  render() {
    const experiment = this.props.experiment.toJS();

    return (
      <h3>{experiment.project_name}: <span className="normal-weight">{experiment.name}</span></h3>
    );
  }
}


export class Experiment extends React.PureComponent {
  static propTypes = {
    experiment: pt.instanceOf(immutable.Map).isRequired,
  };

  render() {
    const experiment = this.props.experiment.toJS();
    const { control, variant } = experiment;

    const experimentButtons = <ExperimentButtons experiment={this.props.experiment} />;
    const experimentTitle = <ExperimentTitle experiment={this.props.experiment} />;

    const startDate = new Date(experiment.proposed_start_date);
    const endDate = new Date(experiment.proposed_end_date);
    const duration = Math.round((endDate - startDate) / (24 * 60 * 60 * 1000));

    return (
      <Card
        title={experimentTitle}
        extra={experimentButtons}
      >
        <h2>Duration: <span className="normal-weight">{duration} days</span></h2>
        <p>
          {experiment.short_description}
        </p>
        <p><a target="_blank" href={experiment.experiment_url}> Read More</a></p>
        <br />

        <h2>Population: <span className="normal-weight">{experiment.population}</span></h2>
        <p>{experiment.client_matching}</p>
        <br />

        <h2>Control Branch: <span className="normal-weight">{control.name} (Ratio: {control.ratio})</span></h2>
        <h3>{experiment.pref_key}={`${control.value}`}</h3>
        <p>{control.description}</p>
        <br />

        <h2>Experimental Branch: <span className="normal-weight">{variant.name} (Ratio: {variant.ratio})</span></h2>
        <h3>{experiment.pref_key}={`${variant.value}`}</h3>
        <p>{variant.description}</p>
      </Card>
    );
  }
}

@connect(
  state => ({
    experiments: getExperiments(state),
  }),
)
@autobind
export class ExperimentsList extends React.PureComponent {
  static propTypes = {
    experiments: pt.instanceOf(immutable.List).isRequired,
  };

  render() {
    const experiments = this.props.experiments.map(experiment => (
      <Row
        key={experiment}
        className="experiment-row"
      >
        <Col>
          <Experiment experiment={experiment} />
        </Col>
      </Row>
    ));

    return (
      <div>
        <h2>
          {experiments.size} New Experiments
        </h2>
        {experiments}
      </div>
    );
  }
}

@connect(
  state => ({
    rejectedExperiment: getRejectedExperiment(state),
  }),
  { selectRejectedExperiment, rejectExperiment },
)
@autobind
export class ExperimentRejectModal extends React.PureComponent {
  static propTypes = {
    rejectedExperiment: pt.instanceOf(immutable.Map),
    rejectExperiment: pt.func.isRequired,
    selectRejectedExperiment: pt.func.isRequired,
  };

  static defaultProps = {
    rejectedExperiment: null,
  };

  constructor(props) {
    super(props);
    this.state = { reason: '' };
  }

  handleReasonChange(e) {
    this.setState({ reason: e.target.value });
  }

  handleCancel() {
    this.props.selectRejectedExperiment(null);
  }

  handleReject() {
    this.props.rejectExperiment(this.props.rejectedExperiment, this.state.reason);
  }

  render() {
    if (this.props.rejectedExperiment) {
      const rejectedExperiment = this.props.rejectedExperiment;

      const title = (
        <h3>
          Reject {rejectedExperiment.name}
        </h3>
      );

      return (
        <Modal
          className="experiment-reject-modal"
          okText="Reject"
          onCancel={this.handleCancel}
          onOk={this.handleReject}
          title={title}
          visible
        >
          <p>Why is this experiment rejected?</p>
          <textarea onChange={this.handleReasonChange} rows={6} />
        </Modal>
      );
    }

    return null;
  }
}

export default class ImportExperimentsPage extends React.PureComponent {
  render() {
    return (
      <div>
        <QueryExperiments />

        <LoadingOverlay requestIds={''}>
          <ExperimentRejectModal />
          <ExperimentsList />
        </LoadingOverlay>
      </div>
    );
  }
}
