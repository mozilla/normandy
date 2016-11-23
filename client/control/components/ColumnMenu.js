import React, { PropTypes as pt } from 'react';
import * as localForage from 'localforage';

export default class ColumnMenu extends React.Component {
  static propTypes = {
    onSelectionChange: pt.func.isRequired,
  };

  static defaultConfig = [{
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
  }];

  constructor(props) {
    super(props);

    this.state = {
      data: ColumnMenu.defaultConfig,
    };
  }

  componentDidMount() {
    localForage.getItem('columns', (err, found) => {
      if (found) {
        this.setState({
          data: found,
        });
      }

      this.sendSelectionsToParent();
    });
  }

  onInputChange(index) {
    return evt => {
      const newData = [].concat(this.state.data);
      newData[index].enabled = evt.target.checked;

      // update local state
      this.setState({
        data: newData,
      });

      // notify the parent that selection has changed
      this.sendSelectionsToParent();
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

  sendSelectionsToParent() {
    // we 'async' this because we need to pull the options from state,
    // and in some cases we need state updates to resolve first
    setTimeout(() => {
      const options = this.getSelectedOptions();
      this.props.onSelectionChange(options);

      console.log('setting...', this.state.data);
      localForage.setItem('columns', this.state.data);
    }, 1);
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
