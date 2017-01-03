import React, { PropTypes as pt } from 'react';

/**
 * Simple component that displays a 'showing X of Y' message
 * based on active filters and how many exist in the recipe list.
 */
export default class RecipeCount extends React.Component {
  static propTypes = {
    displayCount: pt.number.isRequired,
    totalCount: pt.number.isRequired,
    isFiltering: pt.bool,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      displayCount,
      totalCount,
      isFiltering,
    } = this.props;

    // recipe(s)?
    const plural = displayCount === 1 ? '' : 's';

    // "Showing x recipe(s)"
    const displayMessage = `Showing ${displayCount} recipe${plural}`;

    // determine a quick percentage of how many are showing
    const displayPercentage = Math.round(displayCount / (totalCount || 1) * 100);

    // if we're filtering, we're not showing the max number possible
    // so we need to update our message to reflect that
    const displayAddendum = isFiltering && ` of ${totalCount} (${displayPercentage}%)`;

    return (
      <span className="show-count">
        {displayMessage} {displayAddendum}
      </span>
    );
  }
}
