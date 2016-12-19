import React, { PropTypes as pt } from 'react';

/**
 * Simple component which lists a bunch of checkboxes,
 * and emits input changes.
 *
 * @prop {Function} onInputChange
 *   Fires when user has changed a checkbox, with
 *   params (Item value/slug, Checkbox 'checked' status)
 *
 * @prop {Array<Object>} options
 *   List of options to be made into checkboxes, shaped as:
 *   [{
 *     label: 'Display label',
 *     value: 'Checkbox value',
 *     enabled: true || false, // boolean
 *   }, ...]
 */
export default class CheckboxList extends React.Component {
  static propTypes = {
    onInputChange: pt.func.isRequired,
    options: pt.array.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {};

    // Cache of generated event handlers
    this.handlerCache = {};
  }

  /**
   * Handler factory. Given a column value,
   * returns an event handler that calls the
   * onInputChange prop.
   *
   * @param  {string}   boxValue Checkbox value which updated
   * @return {Function}          Wrapped handler
   */
  handleCheckboxChange(boxValue) {
    // check if an existing event handler exists
    if (!this.handlerCache[boxValue]) {
      // if not, create it with the boxValue given
      this.handlerCache[boxValue] = evt =>
        this.props.onInputChange(boxValue, evt.target.checked);
    }

    // return the handling function
    return this.handlerCache[boxValue];
  }

  /**
   * Render
   */
  render() {
    const { options } = this.props;
    return (
      <ul className="checkbox-list">
        {
          (options).map((option, index) =>
            <li key={option.value + index}>
              <label>
                <input
                  name={option.value}
                  type="checkbox"
                  checked={option.enabled}
                  onChange={this.handleCheckboxChange(option.value)}
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
