import React, { PropTypes as pt } from 'react';

export default class CheckboxList extends React.Component {
  static propTypes = {
    onInputChange: pt.func.isRequired,
    options: pt.array.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {};
  }

  handleInputChange(index) {
    return evt => {
      this.props.onInputChange(index, evt.target.checked);
    };
  }

  render() {
    const { options } = this.props;
    return (
      <ul className="column-menu">
        {
          (options).map((option, index) =>
            <li key={option.value + index}>
              <label>
                <input
                  name={option.value}
                  type="checkbox"
                  checked={option.enabled}
                  onChange={this.handleInputChange(index)}
                />
                { option.label }
              </label>
            </li>
          )
        }
      </ul>
    );
  }
}
