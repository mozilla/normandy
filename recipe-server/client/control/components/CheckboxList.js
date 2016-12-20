import React, { PropTypes as pt } from 'react';
import compare from 'client/utils/deep-compare';

/**
 * Simple component which lists a bunch of checkboxes,
 * and emits input changes.
 *
 * @prop {Function} onInputChange
 *   Fires when user has changed a checkbox, with
 *   params (Item index, Checkbox 'checked' status)
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
   * @param  {[type]} newProps [description]
   * @return {[type]}          [description]
   */
  componentWillReceiveProps(newProps) {
    if (compare(newProps.options, this.props.options)) {
      this.handlerCache = {};
    }
  }

  /**
   * Handler factory. Given a column value,
   * returns an event handler that calls the
   * onInputChange prop.
   *
   * @param  {string}   colValue Checkbox value which updated
   * @return {Function}          Wrapped handler
   */
  handleCheckboxChange(colValue) {
    // check if an existing event handler exists
    if (!this.handlerCache[colValue]) {
      // if not, create it with the colValue given
      this.handlerCache[colValue] = evt =>
        this.props.onInputChange(colValue, evt.target.checked);
    }

    // return the handling function
    return this.handlerCache[colValue];
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
