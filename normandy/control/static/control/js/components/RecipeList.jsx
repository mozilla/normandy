import React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import ControlActions from '../actions/ControlActions.js'

class RecipeDataRow extends React.Component {
  render() {
    const { recipe, dispatch } = this.props;

    return (
      <tr key={recipe.id} onClick={(e) => {
        dispatch(ControlActions.setSelectedRecipe(recipe.id));
        dispatch(push(`/control/recipe/${recipe.id}/`))
      }}>
        <td>{recipe.name}</td>
        <td>{recipe.action_name}</td>
        <td>
          {(() => {
            switch(recipe.enabled) {
              case true: return <i className="fa fa-lg fa-check green">&nbsp;</i>;
              case false: return <i className="fa fa-lg fa-times red">&nbsp;</i>;
            }
          })()}
        </td>
        <td>{recipe.sample_rate}</td>
        <td>{recipe.release_channels}</td>
      </tr>
    )
  }
}


class RecipeList extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    const { dispatch } = this.props
    dispatch(ControlActions.makeApiRequest('fetchAllRecipes', {}));
    dispatch(ControlActions.setSelectedRecipe(null));
  }

  render() {
    return (
      <div className="fluid-8">
        <table id="recipe-list">
          <thead>
            <tr>
              <td>Name</td>
              <td>Action</td>
              <td>Enabled</td>
              <td>Sample Rate</td>
              <td>Release Channels</td>
            </tr>
          </thead>
          <tbody>
            {
              this.props.recipes.map(recipe =>
                <RecipeDataRow recipe={recipe} dispatch={this.props.dispatch} key={recipe.id} />
              )
            }
          </tbody>
        </table>
      </div>
    )
  }
}

let mapStateToProps = (state, ownProps) => {
  return {
    recipes: state.controlApp.recipes || [],
    dispatch: ownProps.dispatch
  }
}

export default connect(
  mapStateToProps
)(RecipeList)
