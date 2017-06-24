import React, { PropTypes as pt } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { Table, Thead, Th, Tr, Td } from 'reactable';

import QueryExtensions from 'control/components/data/QueryExtensions';
import { getAllExtensions } from 'control/state/extensions/selectors';
import { isRequestInProgress } from 'control/state/requests/selectors';


class ExtensionList extends React.Component {
  static propTypes = {
    extensions: pt.array.isRequired,
    isLoading: pt.bool.isRequired,
  };

  showDetails(extension) {
    browserHistory.push(`/control/extension/${extension.get('id')}/`);
  }

  render() {
    const { extensions, isLoading } = this.props;

    return (
      <div>
        <QueryExtensions />
        <div className="fluid-8">
          {
            isLoading &&
              <div
                className="loading callout"
                children={'Loading...'}
              />
          }

          <Table
            className="recipe-list"
            sortable
          >
            <Thead>
              <Th column="name">
                <span>Name</span>
              </Th>
            </Thead>
            {extensions.map(extension =>
              <Tr
                key={extension.get('id')}
                onClick={() => this.showDetails(extension)}
              >
                <Td column="name">{extension.get('name')}</Td>
              </Tr>
            )}
          </Table>
        </div>
      </div>
    );
  }
}


export default connect(
  state => ({
    extensions: getAllExtensions(state).toArray(),
    isLoading: isRequestInProgress(state, 'fetch-all-extensions'),
  }),
)(ExtensionList);
