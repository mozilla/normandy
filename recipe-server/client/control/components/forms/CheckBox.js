import { Checkbox } from 'antd';
import autobind from 'autobind-decorator';

import LabeledInput from './LabeledInput';

@autobind
export default class LabeledCheckbox extends LabeledInput {
  getElement() {
    return Checkbox;
  }

  getElementProps() {
    return { checked: this.props.value };
  }

  getLabelProps() {
    return {
      role: 'checkbox',
      'aria-checked': this.props.value,
    };
  }
}

