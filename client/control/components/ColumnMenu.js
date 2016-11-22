import React, { PropTypes as pt } from 'react';

export default class ColumnMenu extends React.Component {
  static propTypes = {
    onSelectionChange: pt.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      data: [{
        label: 'Name',
        value: 'name',
        enabled: true,
      }, {
        label: 'Action Name',
        value: 'action',
        enabled: true,
      }, {
        label: 'Enabled',
        value: 'enabled',
        enabled: true,
      }, {
        label: 'Channels',
        value: 'channels',
      }, {
        label: 'Locales',
        value: 'locales',
      }, {
        label: 'Countries',
        value: 'countries',
      }, {
        label: 'Start Time',
        value: 'startTime',
      }, {
        label: 'End Time',
        value: 'endTime',
      }, {
        label: 'Additional Filters',
        value: 'additionalFilter',
      }, {
        label: 'Last Updated',
        value: 'last_updated',
        enabled: true,
      }, {
        label: 'Metadata',
        value: 'metadata',
        enabled: true,
      }],
    };
  }

  componentDidMount() {
    this.props.onSelectionChange(this.getSelectedOptions());
  }

  onInputChange(index) {
    return evt => {
      const newData = [].concat(this.state.data);
      newData[index].enabled = evt.target.checked;

      // notify the parent that selection has changed
      this.props.onSelectionChange(this.getSelectedOptions());

      // update local state
      this.setState({
        data: newData,
      });
    };
  }

  getSelectedOptions() {
    const selected = [];
    this.state.data.forEach(option => {
      if (option.enabled) {
        selected.push({
          value: option.value,
          label: option.label,
        });
      }
    });

    return selected;
  }

  render() {
    const { data } = this.state;
    return (
      <ul>
        {
          data.map((option, index) =>
            <li key={option.value + index}>
              <label htmlFor={option.value}>
                <input
                  name={option.value}
                  type="checkbox"
                  checked={option.enabled}
                  onChange={this.onInputChange(index)}
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
