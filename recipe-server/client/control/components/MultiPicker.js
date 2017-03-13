import React, { PropTypes as pt } from 'react';

export default class MultiPicker extends React.Component {
  static propTypes = {
    unit: pt.string.isRequired,
    plural: pt.string.isRequired,
    options: pt.array,
    // from redux-form
    value: pt.oneOfType([pt.array, pt.string]),
    onChange: pt.func,
  };

  static getActiveSelectOptions({ options }) {
    if (!options) {
      return [];
    }

    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }

    return selected.filter(x => x);
  }

  constructor(props) {
    super(props);
    this.state = {
      filterText: null,
    };

    this.handleApplyOption = ::this.handleApplyOption;
    this.handleRemoveOption = ::this.handleRemoveOption;
    this.onTextChange = ::this.onTextChange;
    this.convertValueToObj = ::this.convertValueToObj;
  }

  onTextChange(event) {
    const { value } = event.target;

    this.setState({
      filterText: value,
    });
  }

  getDisplayedOptions() {
    const {
      options = [],
      value,
    } = this.props;

    const selectedOptions = options.filter(option =>
      value.indexOf(option.value) === -1);

    let displayedOptions = [].concat(selectedOptions)
      .map(option => option.value)
      .map(val =>
        (!val ? null : { ...this.convertValueToObj(val) }))
      .filter(x => x);

    const {
      filterText,
    } = this.state;

    if (filterText) {
      displayedOptions = displayedOptions.filter(option =>
        JSON.stringify(option).indexOf(filterText) > -1);
    }

    return displayedOptions;
  }

  handleApplyOption(event) {
    event.persist();

    if (!this.availableRef) {
      return;
    }

    const {
      value,
      onChange,
    } = this.props;

    let selectedFilters = MultiPicker.getActiveSelectOptions(this.availableRef);

    if (!selectedFilters || selectedFilters.length === 0) {
      selectedFilters = this.getDisplayedOptions();
      selectedFilters = selectedFilters.map(option => option.value);
    }

    const newOptions = []
      .concat(value || [])
      .concat(selectedFilters);

    // clear user input
    this.availableRef.value = null;

    onChange(newOptions.join(','));
  }

  handleRemoveOption(event) {
    event.persist();
    if (!this.selectedRef) {
      return;
    }

    const {
      value,
      onChange,
    } = this.props;

    const selectedFilters = MultiPicker.getActiveSelectOptions(this.selectedRef);
    let newOptions = []
      .concat(value || [])
      .filter(val => selectedFilters.indexOf(val) === -1);

    if (!selectedFilters || selectedFilters.length === 0) {
      newOptions = [];
    }

    // clear the user selection
    this.selectedRef.value = null;

    onChange(newOptions.join(','));
  }

  convertValueToObj(value) {
    const {
      options = [],
    } = this.props;

    return options.find(option => option.value === value);
  }

  /**
   * Render
   */
  render() {
    const {
      unit,
      plural,
      value,
    } = this.props;

    let pickerValue = value || [];

    if (value && typeof value === 'string') {
      pickerValue = pickerValue.split(',');
    }

    pickerValue = pickerValue.map(this.convertValueToObj);

    const displayedOptions = this.getDisplayedOptions();

    const availableLabel = displayedOptions
      && (displayedOptions.length === 0 || displayedOptions.length > 1)
      ? plural : unit;

    const selectedLabel = pickerValue
      && (pickerValue.length === 0 || pickerValue.length > 1)
      ? plural : unit;

    return (
      <div className="multipicker">

        <div className="mp-frame mp-from">
          {`Available ${availableLabel}`}

          <input
            type="text"
            placeholder={`Search ${plural}`}
            onChange={this.onTextChange}
          />

          <select ref={ref => { this.availableRef = ref || this.availableRef; }} multiple>
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
          <button type="button" onClick={this.handleApplyOption}>Add {unit}</button>
        </div>

        {
          !!pickerValue &&
            <div className="mp-button-group">
              <button
                onClick={this.handleRemoveOption}
                type="button"
              >
                ⇜
              </button>
              <button
                onClick={this.handleApplyOption}
                type="button"
              >
                ⇝
              </button>
            </div>
        }

        <div className="mp-frame mp-to">
          {`Selected ${selectedLabel}`}
          <select ref={ref => { this.selectedRef = ref || this.selectedRef; }} multiple>
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
          { !!pickerValue && !!pickerValue.length &&
            <button type="button" onClick={this.handleRemoveOption}>Remove {unit}</button>
          }
        </div>
      </div>
    );
  }
}
