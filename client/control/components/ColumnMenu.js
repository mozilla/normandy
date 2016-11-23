import React, { PropTypes as pt } from 'react';

export default class ColumnMenu extends React.Component {
  static propTypes = {
    onInputChange: pt.func.isRequired,
    columns: pt.array.isRequired,
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
    const { columns } = this.props;
    return (
      <ul>
        {
          (columns).map((option, index) =>
            <li key={option.value + index}>
              <label htmlFor={option.value}>
                <input
                  name={option.value}
                  type="checkbox"
                  checked={option.enabled}
                  onChange={this.handleInputChange(index)}
                />
                <span>
                  { option.label }
                </span>
              </label>
            </li>
          )
        }
      </ul>
    );
  }
}
