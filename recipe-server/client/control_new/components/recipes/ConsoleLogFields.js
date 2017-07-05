import { Input } from 'antd';
import { Map } from 'immutable';
import pt from 'prop-types';
import React from 'react';

import { FormItem } from 'control_new/components/common/forms';


export default class ConsoleLogFields extends React.Component {
  static propTypes = {
    recipeArguments: pt.instanceOf(Map),
  };


  render() {
    const { recipeArguments = new Map() } = this.props;
    return (
      <div>
        <p className="action-info">Log a message to the console.</p>
        <FormItem
          name="arguments.message"
          label="Message"
          initialValue={recipeArguments.get('message')}
        >
          <Input />
        </FormItem>
      </div>
    );
  }
}
