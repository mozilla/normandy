import { Switch } from 'antd';
import autobind from 'autobind-decorator';

import LabeledInput from './LabeledInput';

@autobind
export default class SwitchBox extends LabeledInput {
  handleLabelClick() {
    const newValue = !this.props.value;

    this.props.onChange(newValue);
  }

  getElement() {
    return Switch;
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

