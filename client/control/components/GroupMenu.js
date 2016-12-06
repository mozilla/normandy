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
  handleItemClick(group, option) {
    return () => this.props.onItemSelect(group, option);
  }

  /**
   * Render
   */
  render() {
    const {
      data,
      searchText,
    } = this.props;

    // no array or an empty array = no filters to show
    const noData = !data || !data.length;

    let noResults;
    if (noData) {
      // if the user has entered text, but there
      // are no matches for it..
      if (searchText) {
        noResults = <span>No results for <b>"{searchText}"</b></span>;
      } else {
        // if we don't have any results,
        // but it's unrelated to the text search..
        noResults = <span>No filters to display.</span>;
      }
    }

    return (
      <div
        className="group-menu"
      >
        { noResults }
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
                    onClick={this.handleItemClick(group, option)}
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
