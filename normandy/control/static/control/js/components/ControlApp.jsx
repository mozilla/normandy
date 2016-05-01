import React from 'react'

export default class ControlApp extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="content" className="wrapper">
          <div className="fluid-8">
            {React.Children.map(this.props.children,
              (child) => React.cloneElement(child))}
          </div>
      </div>
    )
  }
}
