import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import ControlActions from '../actions/ControlActions.js'
import { reduxForm } from 'redux-form'
import composeRecipeContainer from './RecipeContainer.jsx'


class RecipeForm extends React.Component {
  constructor(props) {
    super(props);
    this.submitForm = this.submitForm.bind(this);
  }

  submitForm(values) {
    if (this.props.recipeId) {
      this.props.dispatch(ControlActions.makeApiRequest('updateRecipe', { recipe: values, recipeId: this.props.recipeId }));
    } else {
      this.props.dispatch(ControlActions.makeApiRequest('addRecipe', values));
    }
  }

  render() {
    const { fields: { name, filter_expression }, recipeId, handleSubmit } = this.props;
    return (
      <form onSubmit={handleSubmit(this.submitForm)} className="crud-form">
        <div className="row">
          <div className="fluid-3">
            <label>Name</label>
            <input type="text" field={name} {...name} />
          </div>
        </div>
        <div className="row">
          <div className="fluid-3">
            <label>Filter Expression</label>
            <textarea field={filter_expression} {...filter_expression} />
          </div>
        </div>
        <div className="row form-action-buttons">
          <div className="fluid-2">
            {recipeId ? <Link className="button delete" to={`/control/recipe/${recipeId}/delete/`}>Delete</Link> : ''}
          </div>
          <div className="fluid-2 float-right">
            <button className="button" type="submit">Submit</button>
          </div>
        </div>
      </form>
    )
  }
}
RecipeForm.propTypes = {
  fields: React.PropTypes.object.isRequired,
}

export default composeRecipeContainer(reduxForm({
    form: 'recipe',
    fields: ['name', 'filter_expression']
  }, (state, props) => ({ // mapStateToProps
    initialValues: (props.recipe || null)
  })
)(RecipeForm))
