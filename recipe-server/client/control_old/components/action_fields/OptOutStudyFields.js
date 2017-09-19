import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';

import { ControlField } from 'control_old/components/Fields';
import ActionFields from 'control_old/components/action_fields/ActionFields';
import QueryExtensions from 'control_old/components/data/QueryExtensions';
import { getAllExtensions } from 'control_old/state/extensions/selectors';


/**
 * Form fields for the opt-out-study action.
 */
class OptOutStudyFields extends ActionFields {
  static propTypes = {
    disabled: pt.bool,
    extensions: pt.array,
  }

  render() {
    const { disabled, extensions } = this.props;
    return (
      <div className="arguments-fields">
        <QueryExtensions />

        <p className="info">Enroll the user in an opt-out SHIELD study</p>

        <ControlField
          disabled={disabled}
          label="Study Name"
          name="arguments.name"
          component="input"
          type="text"
        />

        <ControlField
          disabled={disabled}
          label="Study Description"
          name="arguments.description"
          component="textarea"
        />

        <ControlField
          disabled={disabled}
          label="Add-on"
          name="arguments.addonUrl"
          component="select"
        >
          {extensions.map(extension => (
            <option key={extension.get('id')} value={extension.get('xpi')}>
              {extension.get('name')}
            </option>
          ))}
        </ControlField>

        <ControlField
          label="Pause Enrollment (If checked, no new study participants will be enrolled)"
          name="arguments.isEnrollmentPaused"
          component="input"
          type="checkbox"
          className="checkbox-field"
          disabled={disabled}
        />
      </div>
    );
  }
}

export default connect(
  state => ({
    extensions: getAllExtensions(state).toArray(),
  }),
)(OptOutStudyFields);
