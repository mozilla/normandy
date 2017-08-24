import { Select } from 'antd';
import autobind from 'autobind-decorator';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { getAllLoadedExtensions, getExtensionPageCount, getExtensionListingCount }
  from 'control_new/state/app/extensions/selectors';

import QueryMultipleExtensions from 'control_new/components/data/QueryMultipleExtensions';

import { getAllLoadedRecipes, getRecipePageCount, getRecipeListingCount } from 'control_new/state/app/recipes/selectors';
import QueryFilteredRecipes from 'control_new/components/data/QueryFilteredRecipes';

const { Option } = Select;

@autobind
export class PaginatedSelect extends React.Component {
  static propTypes = {
    query: PropTypes.node.isRequired,
    list: PropTypes.instanceOf(List).isRequired,
    totalNumItems: PropTypes.number.isRequired,
    numPages: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    optionRender: PropTypes.func.isRequired,
    value: PropTypes.any,
  };

  static defaultProps = {
    value: null,
    totalNumItems: Infinity,
    numPages: 1,
  };

  state = {
    currentPage: 1,
    hasAllPages: false,
  };

  componentWillMount() {
    this.setState({
      // If we only have one or fewer pages on startup, we already have all items!
      hasAllPages: this.checkHasAllPages(this.props),
    });
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      // numPages can change as the Query components work. This will
      // toggle the `Show more...` button accordingly.
      hasAllPages: this.checkHasAllPages(newProps),
    });
  }

  onValueChange(...args) {
    // If the user selected the `Show More...` button, move pagination to the next page.
    if (args[0] === 'show-more') {
      this.setState({
        currentPage: this.state.currentPage + 1,
        hasAllPages: this.state.currentPage + 1 >= this.props.numPages,
      });

      // Return to prevent the select box from choosing `show-more` as its current value.
      return;
    }

    this.props.onChange(...args);
  }

  checkHasAllPages({ numPages, list, totalNumItems }) {
    // Checks if there are multiple pages to pull, if we're on the last of the pages,
    // or if we have all of the items in store already.
    return numPages <= 1 || this.state.currentPage >= numPages || list.size >= totalNumItems;
  }

  render() {
    // Compile a list of options, since `Select` doesn't like to have falsey children.
    let displayedOptions = new List();
    displayedOptions = displayedOptions.concat(this.props.list.map(this.props.optionRender));

    // `Show More...` is only if there are other options to show.
    if (!this.state.hasAllPages) {
      displayedOptions = displayedOptions.push(
        <Option className="select-show-more" value={'show-more'}>Show More...</Option>);
    }

    const QueryComponent = this.props.query;

    return (
      <span>
        <QueryComponent pageNumber={this.state.currentPage} />
        <Select
          {...this.props}
          onChange={this.onValueChange}
          onSelect={this.onValueChange}
          defaultValue={this.props.value}
        >
          { displayedOptions }
        </Select>
      </span>
    );
  }
}

@connect(
  state => ({
    extensions: getAllLoadedExtensions(state),
    lastExtensionPage: getExtensionPageCount(state),
    totalNumItems: getExtensionListingCount(state),
  }),
)
export class ExtensionSelect extends React.Component {
  static propTypes = {
    extensions: PropTypes.instanceOf(List).isRequired,
    lastExtensionPage: PropTypes.number.isRequired,
    totalNumItems: PropTypes.number.isRequired,
  };

  render() {
    return (
      <PaginatedSelect
        {...this.props}
        query={QueryMultipleExtensions}
        list={this.props.extensions}
        numPages={this.props.lastExtensionPage}
        totalNumItems={this.props.totalNumItems}
        optionRender={extension =>
          (<Option key={extension.get('id')} value={extension.get('xpi')}>
            {extension.get('name')}
          </Option>)
        }
      />
    );
  }
}


@connect(
  state => ({
    recipes: getAllLoadedRecipes(state),
    lastRecipesPage: getRecipePageCount(state),
    totalNumItems: getRecipeListingCount(state),
  }),
)
export class RecipeSelect extends React.Component {
  static propTypes = {
    recipes: PropTypes.instanceOf(List).isRequired,
    lastRecipesPage: PropTypes.number.isRequired,
    totalNumItems: PropTypes.number.isRequired,
  };

  render() {
    return (
      <PaginatedSelect
        {...this.props}
        query={QueryFilteredRecipes}
        list={this.props.recipes}
        numPages={this.props.lastRecipesPage}
        totalNumItems={this.props.totalNumItems}
        optionRender={recipe =>
          (<Option key={recipe.get('id')} value={recipe.get('id')}>
            {recipe.get('name')}
          </Option>)
        }
      />
    );
  }
}
