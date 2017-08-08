import React from 'react';


export default class MissingPage extends React.Component {
  render() {
    return (
      <div className="page-404">
        <h1>404</h1>
        <p>Page not found.</p>
        <button onClick={() => window.history.back()}>Go back.</button>
      </div>
    );
  }
}
