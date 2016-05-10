import React from 'react'
import composeRecipeContainer from './RecipeContainer.jsx'
import {runRecipe} from '../../../../../selfrepair/static/js/self_repair_runner.js';

class RecipePreview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      recipeExecuted: false,
    };
  }

  componentWillMount() {
    this.attemptPreview();
  }

  componentDidUpdate() {
    this.attemptPreview();
  }

  attemptPreview() {
    const {recipe} = this.props;
    const {recipeExecuted} = this.state;

    if (recipe && !recipeExecuted) {
      runRecipe(recipe, {testing: true}).catch(err => {
        console.error(err);
      });

      this.setState({recipeExecuted: true});
    }
  }

  render() {
    const {recipe} = this.props;
    if (recipe) {
      return (
        <div className="fluid-7">
          Previewing {recipe.name}...
        </div>
      );
    } else {
      return null;
    }
  }
}

export default composeRecipeContainer(RecipePreview);
