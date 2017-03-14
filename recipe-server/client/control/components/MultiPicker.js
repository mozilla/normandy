import React, { PropTypes as pt } from 'react';
import { propTypes as reduxFormPropTypes } from 'redux-form';

export default class MultiPicker extends React.Component {
  static propTypes = {
    unit: pt.string.isRequired,
    options: pt.array,
    value: reduxFormPropTypes.value,
    onChange: reduxFormPropTypes.onChange,
  };

  static getActiveSelectOptions = selectElement =>
    Array.from(selectElement.selectedOptions).map(option => option.value).filter(x => x);

  constructor(props) {
    super(props);
    this.state = {
      filterText: null,
    };

    this.handleChangeOption = ::this.handleChangeOption;
    this.handleTextChange = ::this.handleTextChange;
    this.getOptionFromValue = ::this.getOptionFromValue;
  }

  /**
   * Given an option's value, finds the specified option from the given
   * props.options list, and returns it.
   *
   * @param  {string} value Option's value
   * @return {object}       Option object (has label, value)
   */
  getOptionFromValue(value) {
    const {
      options = [],
    } = this.props;

    return options.find(option => option.value === value);
  }

  getDisplayedOptions() {
    const {
      options = [],
      value,
    } = this.props;

    const {
      filterText,
    } = this.state;

    let selectedOptions = options.filter(option => value.indexOf(option.value) === -1);

    if (filterText) {
      const searchText = filterText.toLowerCase();

      selectedOptions = selectedOptions.filter(option => {
        const searchValues = Object.values(option).join(' ').toLowerCase();
        return searchValues.indexOf(searchText) > -1;
      });
    }

    return selectedOptions;
  }

  handleTextChange(event) {
    this.setState({
      filterText: event.target.value,
    });
  }

  handleChangeOption(type) {
    return () => {
      const ref = type === 'apply' ? this.availableRef : this.selectedRef;
      if (!type || !ref) {
        return;
      }

      const {
        value = [],
        onChange = () => {},
      } = this.props;

      // Get a list of all selected values.
      let selection = [].concat(value);
      // Pick up list of selected options from the dom ref
      const refSelected = MultiPicker.getActiveSelectOptions(ref);

      // Apply = take from the 'available' section and put in 'selected'
      if (type === 'apply') {
        selection = selection.concat(refSelected);
      // Remove = take from 'selected' and put back in 'available'
      } else if (type === 'remove') {
        selection = selection.filter(val => refSelected.indexOf(val) === -1);
      }

      // Clear user input.
      ref.value = null;

      // Report the updated selected filters to the parent.
      onChange(selection.join(','));
    };
  }

  /**
   * Render
   */
  render() {
    const {
      unit,
      value,
    } = this.props;

    let pickerValue = value || [];

    // Value can be a string or an array, but we want an array.
    if (value && typeof value === 'string') {
      pickerValue = pickerValue.split(',');
    }

    // We're given a comma-separated list of strings as values,
    // so we'll convert those values into their respective `option`s here
    pickerValue = pickerValue.map(this.getOptionFromValue);

    const displayedOptions = this.getDisplayedOptions();

    return (
      <div className="multipicker">

        <div className="mp-frame mp-from">
          {`Available ${unit}`}

          <input
            type="search"
            placeholder={`Search ${unit}`}
            onChange={this.handleTextChange}
          />

          <select ref={ref => { this.availableRef = ref; }} multiple>
            {
              (displayedOptions).map((option, idx) =>
                <option
                  key={idx}
                  title={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            }
          </select>
        </div>

        {
          pickerValue &&
            <div className="mp-button-group">
              <button
                onClick={this.handleChangeOption('remove')}
                type="button"
              >
                ⇜
              </button>
              <button
                onClick={this.handleChangeOption('apply')}
                type="button"
              >
                ⇝
              </button>
            </div>
        }

        <div className="mp-frame mp-to">
          {`Selected ${unit}`}
          <select ref={ref => { this.selectedRef = ref; }} multiple>
            {
              pickerValue.map((option, idx) =>
                <option
                  key={idx}
                  title={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            }
          </select>
        </div>
      </div>
    );
  }
}
