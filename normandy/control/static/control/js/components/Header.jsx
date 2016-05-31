import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Link } from 'react-router';

class Header extends React.Component {
  render() {
    const { pageTitle, subTitle, ctaButtons } = this.props.pageType;
    let ctaBtns;
    if (ctaButtons) {
      ctaBtns = ctaButtons.map(({text, icon, link}, index) => (
        <Link className="button" to={this.props.currentLocation + link}>
          <i className={"pre fa fa-" + icon}></i> {text}
        </Link>
      ))
    }
    return (
      <div id="page-header">
        <h2>
          <Link to={`/control/`}>Recipes</Link>
          {pageTitle ? [': ', <span>{pageTitle}</span>] : '' }
        </h2>
        {ctaBtns}
      </div>
    )
  }
}

export default withRouter(Header)
