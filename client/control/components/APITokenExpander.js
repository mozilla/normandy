import React, { Component, PropTypes as pt } from 'react';
import QueryAPIToken from './data/QueryAPIToken.js';

export default class APITokenExpander extends Component {
  static propTypes = {
    token: pt.shape({ key: pt.string }),
  };

  constructor(props) {
    super(props);
    this.state = { expanded: false };
    this.toggleExpand = ::this.toggleExpand;
  }

  toggleExpand() {
    this.setState({ expanded: !this.state.expanded });
  }

  render() {
    const { token } = this.props;
    const { expanded } = this.state;

    const expandButton = (
      <button className="button-icon" onClick={this.toggleExpand}>
        <i className="fa fa-gear" />
      </button>
    );

    if (expanded) {
      return (
        <span>
          <QueryAPIToken />
          {token && `API Key: ${token.key}`}
          {expandButton}
        </span>
      );
    }
    return (
      <span>
        {expandButton}
      </span>
    );
  }
}
