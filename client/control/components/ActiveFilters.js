import React, { PropTypes as pt } from 'react';

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

    this.cacheElements();
  }

  /**
   * Render
   */
  render() {
    const {
      className,
      selectedFilters,
      onResetFilters,
      onFilterSelect,
    } = this.props;

    // optional className prop
    const displayedClass = `active-filters ${className || ''}`;

    // no filters = we dont render anything at all
    if (!selectedFilters || !selectedFilters.length) {
      return null;
    }

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
                    onClick={() => {
                      onFilterSelect({
                        group: filter,
                        option,
                        isEnabled: false,
                      });
                    }}
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
