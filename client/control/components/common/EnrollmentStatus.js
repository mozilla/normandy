import { Icon } from 'antd';
import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'redux-little-router';

// Ideally the prop.recipe would be an Immutable Map, but Ant's Table works with
// plain JS objects, which means this component can not be Pure.
export default class EnrollmentSatus extends React.Component {
  static propTypes = {
    recipe: PropTypes.object.isRequired,
  };

  getLabel() {
    let label = 'Disabled';
    if (this.isRecipeEnabled()) {
      label = this.isRecipePaused() ? 'Paused' : 'Active';
    }
    return label;
  }

  getIcon() {
    let iconType = 'minus';
    if (this.isRecipeEnabled()) {
      iconType = this.isRecipePaused() ? 'pause' : 'check';
    }
    return iconType;
  }

  getColor() {
    let colorClass;
    if (this.isRecipeEnabled()) {
      colorClass = this.isRecipePaused() ? 'is-false' : 'is-true';
    }
    return colorClass;
  }

  isRecipePaused() {
    const { recipe } = this.props;
    return !recipe.enabled || !!recipe.arguments.isEnrollmentPaused;
  }

  isRecipeEnabled() {
    const { recipe } = this.props;
    return recipe.enabled;
  }

  render() {
    const {
      recipe,
    } = this.props;

    return (
      <Link href={`/recipe/${recipe.id}/`} className={cx('status-link', !recipe.enabled && 'is-lowkey')}>
        <Icon
          className={cx('status-icon', this.getColor())}
          type={this.getIcon()}
        />
        <span className="enrollment-label">{this.getLabel()}</span>
      </Link>
    );
  }
}
