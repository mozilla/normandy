import { Input } from 'antd';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import FormItem from 'control/components/forms/FormItem';


export default class JSONArgumentsField extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    recipeArguments: PropTypes.instanceOf(Map),
  };

  static defaultProps = {
    disabled: false,
    recipeArguments: new Map(),
  };


  render() {
    const {
      disabled,
      recipeArguments,
    } = this.props;

    return (
      <div>
        <p className="action-info">Contextual UI is not available for this action.</p>
        <FormItem
          name="arguments"
          label="JSON blob"
          initialValue={JSON.stringify(recipeArguments, null, 2)}
        >
          <Input type="textarea" rows="10" disabled={disabled} />
        </FormItem>
      </div>
    );
  }
}
