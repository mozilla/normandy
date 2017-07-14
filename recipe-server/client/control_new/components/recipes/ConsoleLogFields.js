import { Input } from 'antd';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import { FormItem } from 'control_new/components/common/forms';


export default class ConsoleLogFields extends React.Component {
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
        <p className="action-info">Log a message to the console.</p>
        <FormItem
          name="arguments.message"
          label="Message"
          initialValue={recipeArguments.get('message', '')}
        >
          <Input disabled={disabled} />
        </FormItem>
      </div>
    );
  }
}
