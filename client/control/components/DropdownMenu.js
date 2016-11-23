import React, { PropTypes as pt } from 'react';

export default class DropdownMenu extends React.Component {
  static propTypes = {
    trigger: pt.node.isRequired,
    children: pt.any.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      isVisible: false,
    };

    this.toggleVisibility = ::this.toggleVisibility;
  }

  toggleVisibility() {
    this.setState({
      isVisible: !this.state.isVisible,
    });
  }

  render() {
    return (
      <div
        className="dropdown-menu"
      >
        <div
          className="dropdown-trigger"
          onClick={this.toggleVisibility}
        >
          { this.props.trigger }
        </div>
        <div className="dropdown-content">
          {
            this.state.isVisible &&
            this.props.children
          }
        </div>
      </div>
    );
  }
}
