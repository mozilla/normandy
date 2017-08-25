import autobind from 'autobind-decorator';
import { message } from 'antd';
import React from 'react';

import FormItem from 'control_new/components/forms/FormItem';

@autobind
export default class TrimWhitespaceFormItem extends React.Component {
  constructor(props) {
    super(props);
    this.shouldNotify = true;
  }

  trimValue(event) {
    const trimmed = event.target.value.trim();
    if (trimmed !== event.target.value && this.shouldNotify) {
      this.shouldNotify = false;
      message.info(
        'Whitespace was automatically trimmed from the Preference Name.',
        1.5,
        () => { this.shouldNotify = true; });
    }
    return trimmed;
  }

  render() {
    return (
      <FormItem
        config={{ getValueFromEvent: this.trimValue }}
        {...this.props}
      />
    );
  }
}
