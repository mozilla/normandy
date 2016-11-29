import React, { PropTypes as pt } from 'react';
import uuid from 'node-uuid';

import closest from 'client/utils/closest';


export default class DropdownMenu extends React.Component {
  static propTypes = {
    trigger: pt.node.isRequired,
    children: pt.any.isRequired,
    useClick: pt.boolean,
    useFocus: pt.boolean,
    // pin the dropdown to the right edge
    // of the parent container?
    pinRight: pt.boolean,
  };

  constructor(props) {
    super(props);

    this.state = {
      isVisible: false,
    };

    this.toggleVisibility = ::this.toggleVisibility;
    this.onMenuBlur = ::this.onMenuBlur;
  }

  componentDidMount() {
    this.id = this.id || `dropdown-menu-${uuid()}`;
  }

  componentWillUnmount() {
    // just toggle it to hide when component unmounts
    // (this will automatically remove event bindings etc too)
    this.toggleVisibility(false);
  }

  onMenuBlur(evt) {
    // determine if the click was inside of this .dropdown-menu
    if (!closest(evt.target, `.${this.id}`)) {
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
        className={`dropdown-menu ${this.id}`}
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
            <div
              className="dropdown-content"
              style={this.props.pinRight ? { right: 0, left: 'auto' } : { left: 0, right: 'auto' }}
            >
              { this.props.children }
            </div>
        }
      </div>
    );
  }
}
