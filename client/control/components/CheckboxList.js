import React, { PropTypes as pt } from 'react';

/**
 * Simple component which lists a bunch of checkboxes,
 * and emits input changes.
 */

export default class CheckboxList extends React.Component {
  static propTypes = {
    onInputChange: pt.func.isRequired,
    options: pt.array.isRequired,
  };

  /**
   * Handler factory. Given an index,
   * returns an event handler that calls the
   * onInputChange prop.
   *
   * @param  {Number}   index Checkbox index which updated
   * @return {Function}       Wrapped handler
   */
  handleInputChange(index) {
    return evt => {
      this.props.onInputChange(index, evt.target.checked);
    };
  }

  /**
   * Render
   */
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
