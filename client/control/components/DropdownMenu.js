import React, { PropTypes as pt } from 'react';
import closest from '../../utils/closest';

export default class DropdownMenu extends React.Component {
  static propTypes = {
    trigger: pt.node.isRequired,
    children: pt.any.isRequired,
    useClick: pt.boolean,
    useFocus: pt.boolean,
  };

  constructor(props) {
    super(props);

    this.state = {
      isVisible: false,
    };

    this.toggleVisibility = ::this.toggleVisibility;
    this.onMenuBlur = ::this.onMenuBlur;
  }

  componentWillUnmount() {
    // just toggle it to hide when component unmounts
    // (this will automatically remove event bindings etc too)
    this.toggleVisibility(false);
  }

  onMenuBlur(evt) {
    // determine if the click was inside of a .dropdown-menu
    if (!closest(evt.target, '.dropdown-menu')) {
      // and if so, close it
      this.toggleVisibility(false);
    }
  }

  updateWindowBinding(shouldBind) {
    if (shouldBind) {
      document.body.addEventListener('click', this.onMenuBlur, true);
    } else {
      document.body.removeEventListener('click', this.onMenuBlur);
    }
  }

  toggleVisibility(force) {
    // if we get a parameter, use that instead of just straight up toggling
    const newVisibleState = typeof force === 'boolean' ? force : !this.state.isVisible;

    this.setState({
      isVisible: newVisibleState,
    });

    this.updateWindowBinding(newVisibleState);
  }

  render() {
    return (
      <div
        className="dropdown-menu"
      >
        <div
          className="dropdown-trigger"
          onClick={this.props.useClick && this.toggleVisibility}
          onFocus={this.props.useFocus && this.toggleVisibility}
        >
          { this.props.trigger }
        </div>
        {
          this.state.isVisible &&
            <div className="dropdown-content">
              { this.props.children }
            </div>
        }
      </div>
    );
  }
}
