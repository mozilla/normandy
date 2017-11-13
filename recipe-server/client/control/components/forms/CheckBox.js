import { Checkbox } from 'antd';
import autobind from 'autobind-decorator';

import LabeledInput from './LabeledInput';

@autobind
export default class LabeledCheckbox extends LabeledInput {
  getElement() {
    return Checkbox;
  }

  getElementProps() {
    const { value } = this.props;

    return {
      checked: value,
    };
  }

  getLabelProps() {
    const { value } = this.props;

    return {
      role: 'checkbox',
      'aria-checked': value,
    };
  }
}

