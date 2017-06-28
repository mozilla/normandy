import React from 'react';

export default function MissingPage() {
  return (
    <div className="page-404">
      <h1>404</h1>
      <h3>Page not found.</h3>
      <p>
        <a onClick={() => window.history.back()}>Go back.</a>
      </p>
    </div>
  );
}
