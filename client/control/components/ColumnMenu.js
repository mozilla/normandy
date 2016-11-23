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
      <ul className="column-menu">
        {
          (columns).map((option, index) =>
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
