import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { selector } from 'control/components/RecipeForm';
import { ControlField } from 'control/components/Fields';
import ActionFields from 'control/components/action_fields/ActionFields';

/**
 * Form fields for the preference-rollout action.
 */
export class RolloutFields extends ActionFields {
  static propTypes = {
    recipeArguments: pt.object.isRequired,
    disabled: pt.bool,
  }

  render() {
    const {
      recipeArguments,
      disabled,
    } = this.props;

    return (
      <div className="arguments-fields">
        <p className="info">
          Change a preference for a portion of the population.
          <br /><br />
          Supports gradually increasing the number of users that get a feature, multiple features
          rolling out at once to in/dependent groups, and rolling back a deployment entirely
          (if problems arise).
        </p>
        <ControlField
          disabled={disabled}
          label="Rollout name"
          name="arguments.name"
          component="input"
          type="text"
        />
        <ControlField
          label="Preference to change"
          name="arguments.preferenceName"
          component="input"
          type="text"
        />
        <ControlField
          label="Preference Value"
          name="arguments.preferenceValue"
          component="input"
          type="text"
        />
        <ControlField
          label="Preference Branch"
          name="arguments.preferenceBranch"
          component="select"
        >
          <option value="default">Default</option>
          <option value="user">User*</option>
        </ControlField>
        {
          recipeArguments.preferenceBranch === 'user' &&
            <ControlField
              name="arguments.branchConfirmation"
              label="* I understand this will override existing user-set preferences."
              component="input"
              type="checkbox"
              className="checkbox-field"
              required
            />
        }
      </div>
    );
  }
}

export default connect(
  state => ({
    recipeArguments: selector(state, 'arguments') || {},
  })
)(RolloutFields);
