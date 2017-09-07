import { Icon, Select, Spin } from 'antd';
import autobind from 'autobind-decorator';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import QueryMultipleExtensions from 'control_new/components/data/QueryMultipleExtensions';
import { getExtensionListing } from 'control_new/state/app/extensions/selectors';
import { isRequestInProgress } from 'control_new/state/app/requests/selectors';

const { Option } = Select;

@connect(
  state => ({
    extensions: getExtensionListing(state),
    // For search results, we can assume that we'll always be loading just the
    // first page, so this request ID is a constant.
    isLoadingSearch: isRequestInProgress(state, 'fetch-extensions-page-1'),
  }),
)
@autobind
export default class ExtensionSelect extends React.Component {
  static propTypes = {
    extensions: PropTypes.instanceOf(List).isRequired,
    isLoadingSearch: PropTypes.bool.isRequired,
  };

  // Define the commonly-used elements on the class, so they're compiled only once.
  static placeholderElement = (<span><Icon type="search" />{' Search Extensions'}</span>);
  static noOptionsDisplay = (<span>No extensions found!</span>);
  static loadingDisplay = (<Spin size="small" />);

  state = {
    search: null,
  };

  updateSearch(search) {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.setState({
        search,
      });
    }, 200);
  }

  render() {
    const { search } = this.state;
    let displayedList = this.props.extensions;
    const queryFilters = search ? { text: search } : {};

    const {
      placeholderElement,
      loadingDisplay,
      noOptionsDisplay,
    } = ExtensionSelect;

    const {
      isLoadingSearch,
      ...rest
    } = this.props;

    if (isLoadingSearch) {
      displayedList = new List();
    }

    return (
      <div>
        <QueryMultipleExtensions filters={queryFilters} pageNumber={1} />
        <Select
          {...rest}
          filterOption={false}
          placeholder={placeholderElement}
          notFoundContent={isLoadingSearch ? loadingDisplay : noOptionsDisplay}
          onSearch={this.updateSearch}
          showSearch
        >
          {displayedList.map(item =>
            <Option key={item.get('xpi')}>{item.get('name')}</Option>,
          )}
        </Select>
      </div>
    );
  }
}
