import { Checkbox as AntCheckbox } from 'antd';
import autobind from 'autobind-decorator';

import LabeledInput from './LabeledInput';

@autobind
export default class CheckBox extends LabeledInput {
  handleLabelClick() {
    const newValue = !this.props.value;

    this.props.onChange(newValue);
  }

  getElement() {
    return AntCheckbox;
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

