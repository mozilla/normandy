/* eslint-disable import/no-named-as-default */
import React, { PropTypes as pt } from 'react';
import classNames from 'classnames';

export default class SwitchFilter extends React.Component {
  static propTypes = {
    options: pt.array.isRequired,
    selectedFilter: pt.any.isRequired,
    updateFilter: pt.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      options,
      selectedFilter,
      updateFilter,
    } = this.props;

    return (
      <div className="switch">
        <div className={`switch-selection position-${options.indexOf(selectedFilter)}`} />
        {options.map(option =>
          <span
            key={option}
            className={classNames({ active: (option === selectedFilter) })}
            onClick={() => updateFilter(option)}
          >
          {option}
          </span>
        )}
      </div>
    );
  }
}
