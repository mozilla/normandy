import React, { PropTypes as pt } from 'react';

export default class RecipeCount extends React.Component {
  static propTypes = {
    displayCount: pt.number.isRequired,
    totalCount: pt.number.isRequired,
    isFiltering: pt.boolean,
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

    const plural = displayCount === 1 ? '' : 's';
    const displayMessage = `Showing ${displayCount} recipe${plural}`;

    const displayPercentage = Math.round((displayCount / (totalCount || 1)) * 100);
    const displayAddendum = isFiltering && ` of ${totalCount} (${displayPercentage}%)`;

    return (
      <span className="show-count">
        {displayMessage} {displayAddendum}
      </span>
    );
  }
}
