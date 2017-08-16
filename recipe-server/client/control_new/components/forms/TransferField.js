import { List } from 'immutable';
import { Transfer } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

@autobind
export default class TransferField extends React.Component {

  static propTypes = {
    data: PropTypes.instanceOf(List),
    onChange: PropTypes.func,
    value: PropTypes.instanceOf(List),
  };

  static defaultProps = {
    data: new List(),
    onChange: () => {},
    value: new List(),
  };

  filterOption(inputValue, option) {
    if (!this.filterOptionCache) {
      this.filterOptionCache = {};
    }
    const optionHash = option.map.hashCode();
    const cacheId = inputValue + optionHash;

    if (!this.filterOptionCache[cacheId]) {
      const searchVal = inputValue.toLowerCase();
      const data = [option.map.get('value', ''), option.map.get('key', '')]
        .map(str => str.toLowerCase());

      const found = !!data.find(piece => piece.indexOf(searchVal) > -1);
      this.filterOptionCache[cacheId] = found;
    }

    return this.filterOptionCache[cacheId];
  }

  handleChange(targetKeys) {
    let selection = new List();
    targetKeys.forEach(key => {
      const foundItem = this.props.data.find(obj => obj.get('key') === key);

      selection = selection.push(foundItem.get('key'));
    });

    this.props.onChange(selection);
  }

  render() {
    const data = this.props.data.map(value => ({
      key: value.get('key'),
      title: `${value.get('value')} - ${value.get('key')}`,
      description: value.get('key'),
      map: value,
    }));

    // ant-form values can be `null` to start.
    const val = this.props.value || new List();

    return (
      <Transfer
        {...this.props}
        dataSource={data}
        showSearch
        filterOption={this.filterOption}
        targetKeys={val.toJS()}
        onChange={this.handleChange}
        render={item => item.title}
      />
    );
  }
}
