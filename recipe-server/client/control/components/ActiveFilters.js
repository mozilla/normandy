import React, { PropTypes as pt } from 'react';
import cx from 'classnames';

/**
 * Section above RecipeList's table that displays
 * active filter options and settings, and allows
 * users to reset all/individual filters.
 */

export default class ActiveFilters extends React.Component {
  static propTypes = {
    selectedFilters: pt.array.isRequired,
    onResetFilters: pt.func.isRequired,
    onFilterSelect: pt.func.isRequired,
    className: pt.string,
  };

  constructor(props) {
    super(props);
    this.state = {};

    this.handlerCache = {};
  }

  handleFilterSelect(group, option) {
    const cacheKey = group.value + option.value;

    // check if an existing event handler exists
    if (!this.handlerCache[cacheKey]) {
      // if not, create it with the group and option given
      this.handlerCache[cacheKey] = () =>
        this.props.onFilterSelect(group, option);
    }

    // return the handling function
    return this.handlerCache[cacheKey];
  }


  render() {
    const {
      className,
      selectedFilters,
      onResetFilters,
    } = this.props;

    // no filters = we dont render anything at all
    if (!selectedFilters || !selectedFilters.length) {
      return null;
    }

    // optional className prop
    const displayedClass = cx('active-filters', className);

    return (
      <div className={displayedClass}>
        { selectedFilters.map(filter =>
          <div
            key={filter.value}
            className="enabled-filter"
          >
            <span className="filter-label">
              { filter.label }
            </span>
            { filter.options
                .filter(option => option.selected)
                .map((option, index) =>
                  <div
                    key={option.value + index}
                    className="filter-option"
                    onClick={this.handleFilterSelect(filter, option)}
                    children={option.label || option.value}
                  />)
            }
          </div>)
        }
        { selectedFilters.length &&
          <div
            className="enabled-filter-button"
            onClick={onResetFilters}
            children={'Reset Filters'}
          />
        }
      </div>
    );
  }
}
