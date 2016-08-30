import React, { PropTypes as pt } from 'react';
import classNames from 'classnames';
import composeRecipeContainer from './RecipeContainer.js';
import { runRecipe } from '../../selfrepair/self_repair_runner.js';
import NormandyDriver from '../../selfrepair/normandy_driver.js';
import Mozilla from '../../selfrepair/uitour.js';

class RecipePreview extends React.Component {
  static propTypes = {
    recipe: pt.object.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      status: 'start',
      error: null,
      errorHelp: null,
    };
  }

  componentWillMount() {
    this.attemptPreview();
  }

  componentDidUpdate() {
    this.attemptPreview();
  }

  attemptPreview() {
    const { recipe } = this.props;
    const { status } = this.state;
    const driver = new NormandyDriver();
    driver.registerCallbacks();

    if (recipe && status === 'start') {
      this.pingUITour();
    } else if (recipe && status === 'uitourFound') {
      this.setState({
        status: 'attempting',
      });

      runRecipe(recipe, driver, { testing: true }).then(() => {
        this.setState({
          status: 'executed',
        });
      })
      .catch(error => {
        this.setState({
          status: 'error',
          error: `Error running recipe: ${error}`,
        });
      });
    }
  }

  pingUITour() {
    const timeout = setTimeout(() => {
      const url = new URL(window.location);
      const prefName = 'browser.uitour.testingOrigins';
      const prefValue = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ':'}`;
      this.setState({
        status: 'error',
        error: 'UITour unavailable',
        errorHelp: (
          <span>
            Make sure the pref <code>{prefName}</code> includes <code>{prefValue}</code>.
          </span>
        ),
      });
    }, 1000);

    Mozilla.UITour.ping(() => {
      clearTimeout(timeout);
      this.setState({
        status: 'uitourFound',
      });
    });
  }

  render() {
    const { recipe } = this.props;
    const { status, error, errorHelp } = this.state;
    if (recipe) {
      return (
        <div className="fluid-7">
          <div className="fluid-3">
            <h3>Previewing {recipe.name}...</h3>
            <p><b>Action Type:</b> {recipe.action}</p>
          </div>
          <div className="fluid-3 float-right">
            <ExecuteStatus status={status} error={error} errorHelp={errorHelp} />
          </div>
        </div>
      );
    }
    return null;
  }
}

function ExecuteStatus({ status, error, errorHelp }) {
  let statusColor = 'grey';
  let statusIcon = 'circle';
  let statusText = 'Unknown';

  switch (status) {
    case 'start':
    case 'uitourFound': {
      statusColor = 'blue';
      statusText = 'Initializing';
      break;
    }
    case 'attempting': {
      statusColor = 'green';
      statusIcon = 'circle-thin';
      statusText = 'Running recipe';
      break;
    }
    case 'executed': {
      statusColor = 'green';
      statusText = 'Recipe executed';
      break;
    }
    case 'error': {
      statusColor = 'red';
      statusIcon = 'circle-thin';
      statusText = <span>{error} {errorHelp && <p>{errorHelp}</p>}</span>;
      break;
    }
    default: {
      throw new Error(`Unexpected execution status "${status}"`);
    }
  }

  return (
    <div className={classNames('status-indicator', statusColor)}>
      <i className={`fa fa-${statusIcon} pre`} />
      {statusText}
    </div>
  );
}
ExecuteStatus.propTypes = {
  status: pt.string.isRequired,
  error: pt.node,
  errorHelp: pt.node,
};


export default composeRecipeContainer(RecipePreview);
