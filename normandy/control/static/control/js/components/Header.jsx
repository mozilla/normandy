import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Link } from 'react-router';

class Header extends React.Component {
  constructor() {
    super();
  }

  render() {
    const { pageTitle, subTitle, ctaButton } = this.props.pageType;
    let ctaBtn;
    if (ctaButton) {
      ctaBtn =
      <Link className="button" to={this.props.currentLocation + ctaButton.link}>
        <i className={"pre fa fa-" + ctaButton.icon}></i> {ctaButton.text}
      </Link>
    }
    return (
      <div id="page-header">
        <h2>
          <Link to={`/control/`}>Recipes</Link>
          {pageTitle ? [': ', <span>{pageTitle}</span>] : '' }
        </h2>
        {ctaBtn}
      </div>
    )
  }
}

export default withRouter(Header)
