import React, { PropTypes as pt } from 'react';
import autobind from 'autobind-decorator';
import { Row, Col, Button, Card, Modal } from 'antd';
import { connect } from 'react-redux';


import LoadingOverlay from 'control/components/common/LoadingOverlay';
import QueryExperiments from 'control/components/data/QueryExperiments';
import { importExperiment, selectRejectedExperiment, rejectExperiment } from 'control/state/app/experimenter/actions';
import { getExperiments, getRejectedExperiment } from 'control/state/app/experimenter/selectors';


@connect(null, { importExperiment })
@autobind
export class ExperimentAcceptButton extends React.PureComponent {
  static propTypes = {
    importExperiment: pt.func.isRequired,
    experiment: pt.object.isRequired,
  };

  handleClick() {
    this.props.importExperiment(this.props.experiment);
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
    experiment: pt.object.isRequired,
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
    experiment: pt.object.isRequired,
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
    experiment: pt.object.isRequired,
  };

  render() {
    const { experiment } = this.props;

    return (
      <div>
        <span className="project-name">{experiment.project_name}:</span>
        <span className="experiment-name">{experiment.name}</span>
      </div>
    );
  }
}


export class Experiment extends React.PureComponent {
  static propTypes = {
    experiment: pt.object.isRequired,
  };

  render() {
    const experiment = this.props.experiment;
    const control = experiment.control;
    const variant = experiment.variant;

    const experimentButtons = <ExperimentButtons experiment={experiment} />;
    const experimentTitle = <ExperimentTitle experiment={experiment} />;

    return (
      <div>
        <Card
          title={experimentTitle}
          extra={experimentButtons}
        >
          <div className="experiment-section">
            <div className="experiment-population">
              <span className="experiment-population-size">
                {parseFloat(experiment.population_percent)}%
                of Firefox {experiment.firefox_version} {experiment.firefox_channel}
              </span>
              <span className="experiment-variant-ratios">
                ({control.ratio} Control : {variant.ratio} Variant)
              </span>
            </div>
            <p>{experiment.client_matching}</p>
            <p>{experiment.objectives}</p>
            <a target="_blank" href={experiment.experiment_url}>Read More</a>
          </div>

          <div className="experiment-section">
            <div className="experiment-variant-title">
              <span className="variant-label">Control:</span>
              <span>{control.name}</span>
            </div>
            <span className="experiment-pref-key">{experiment.pref_key}={`${control.value}`}</span>
            <p>{control.description}</p>
          </div>

          <div className="experiment-section">
            <div className="experiment-variant-title">
              <span className="variant-label">Variant:</span>
              <span>{variant.name}</span>
            </div>
            <span className="experiment-pref-key">{experiment.pref_key}={`${variant.value}`}</span>
            <p>{variant.description}</p>
          </div>
        </Card>
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
    rejectExperiment: pt.func.isRequired,
    rejectedExperiment: pt.object,
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
        <div>
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
        </div>
      );
    }

    return null;
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
    experiments: pt.array.isRequired,
  };

  render() {
    const experiments = this.props.experiments.toJS().map(experiment => (
      <Row
        key={experiment.slug}
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
          {experiments.length} New Experiments
        </h2>
        {experiments}
      </div>
    );
  }
}


export default class ImportExperimentsPage extends React.PureComponent {
  render() {
    return (
      <div>
        <QueryExperiments />

        <LoadingOverlay>
          <ExperimentRejectModal />
          <ExperimentsList />
        </LoadingOverlay>
      </div>
    );
  }
}
