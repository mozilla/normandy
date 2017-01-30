import React, { PropTypes as pt } from 'react';

/**
 * Simple menu component which displays groups of items
 * under section headers/labels.
 */
export default class GroupMenu extends React.Component {
  static propTypes = {
    data: pt.array.isRequired,
    onItemSelect: pt.func.isRequired,
    searchText: pt.string,
  };

  /**
   * Creates a click handler based on the
   * group/option passed into it, basically
   * an event handler factory.
   *
   * @param  {Object} group  Group which clicked option belongs to
   * @param  {Object} option Option which was clicked
   * @return {Function}      Wrapped handler
   */
  makeClickItemHandler(group, option) {
    // if no cache exists, build it real quick
    this.clickItemCache = this.clickItemCache || {};
    // reference variable for brevity
    const cache = this.clickItemCache;
    const cacheKey = group.value + option.value + option.label;

    // if the cache misses,
    if (!cache[cacheKey]) {
      // generate the handler
      cache[cacheKey] = () =>
        this.props.onItemSelect(group, option);
    }

    // return the (now cached) handler function
    return cache[cacheKey];
  }

  /**
   * Given a searchText param, creates a filter menu item
   * indicating user can add a custom text filter.
   *
   * @param  {string} searchText (Optional) Text user has entered into combobox
   * @return {Node}              Compiled menu item displaying 'add [text] filter'
   */
  buildTextSearchMessage(searchText) {
    let searchMessage;

    if (searchText) {
      searchMessage = (
        <div
          key={'text'}
          className={'text'}
        >
          <h3 className="group-label">Text Search</h3>
          <div
            className={"menu-item"}
            key={searchText}
            onClick={this.makeClickItemHandler('text', searchText)}
            children={searchText}
          />
        </div>
      );
    }

    return searchMessage;
  }


  render() {
    const {
      data,
      searchText,
    } = this.props;

    const textSearchMessage = this.buildTextSearchMessage(searchText);

    return (
      <div
        className="group-menu"
      >
        { textSearchMessage }
        {
          data.map(group =>
            <div
              key={group.value}
              className={group.value}
            >
              <h3 className="group-label">{group.label}</h3>
              {
                group.options.map((option, index) =>
                  <div
                    className={"menu-item"}
                    key={index}
                    onClick={this.makeClickItemHandler(group, option)}
                  >
                    { option.label || option.value }
                  </div>
                )
              }
            </div>
          )
        }
      </div>
    );
  }
}
