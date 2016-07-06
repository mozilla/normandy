import React, { PropTypes as pt } from 'react';
import classNames from 'classnames';
import composeRecipeContainer from './RecipeContainer.jsx';
import { runRecipe } from '../../../../../selfrepair/static/js/self_repair_runner.js';

class RecipePreview extends React.Component {
  propTypes = {
    recipe: pt.object.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      recipeAttempted: false,
      recipeExecuted: false,
      errorRunningRecipe: null,
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
    const { recipeAttempted } = this.state;

    if (recipe && !recipeAttempted) {
      this.setState({
        recipeAttempted: true,
      });

      runRecipe(recipe, { testing: true }).then(() => {
        this.setState({
          recipeExecuted: true,
        });
      })
      .catch(error => {
        this.setState({
          errorRunningRecipe: error,
        });
      });
    }
  }

  render() {
    const { recipe } = this.props;
    let statusClasses = classNames('status-indicator', {
      green: this.state.recipeExecuted,
      red: this.state.errorRunningRecipe,
    });
    if (recipe) {
      return (
        <div className="fluid-7">
          <div className="fluid-3">
            <h3>Previewing {recipe.name}...</h3>
            <p><b>Action Type:</b> {recipe.action}</p>
          </div>
          <div className="fluid-3 float-right">
            <div className={statusClasses}>
            {this.state.recipeExecuted ?
              [<i className="fa fa-circle pre"></i>, ' Recipe executed'] :
              [<i className="fa fa-circle-thin pre"></i>, ' Running recipe...']
            }
            {this.state.errorRunningRecipe ?
              <p className="red">Error running recipe: {this.state.errorRunningRecipe}</p> : ''
            }
            </div>
          </div>
        </div>
      );
    }
    return null;
  }
}

export default composeRecipeContainer(RecipePreview);
