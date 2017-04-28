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
        <div className="info">
          <p>
            Change a preference permanently for a variable portion of the population.
            <br />
            <br />
            Rollouts are intended for features that have been tested and are ready for release. If
            you are aiming to test preference changes, use a <b>Preference Experiment</b> action
            instead.
          </p>
        </div>

        <ControlField
          disabled={disabled}
          label="Rollout Name"
          name="arguments.name"
          component="input"
          type="text"
        />
        <ControlField
          label="Preference Name"
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
          label="Preference Type"
          name="arguments.preferenceType"
          component="select"
        >
          <option value="boolean">Boolean</option>
          <option value="integer">Integer</option>
          <option value="string">String</option>
        </ControlField>
        <ControlField
          label="Preference Branch"
          name="arguments.preferenceBranch"
          component="select"
        >
          <option value="default">Default</option>
          <option value="user">User</option>
        </ControlField>
        {
          recipeArguments.preferenceBranch === 'user' &&
            <div className="callout-warning has-arrow user-branch-warning">
              Using the <b>User</b> preference branch will override existing user-set preferences.
              Use with caution.
            </div>
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
