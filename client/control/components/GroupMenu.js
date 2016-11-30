import React, { PropTypes as pt } from 'react';

export default class GroupMenu extends React.Component {
  static propTypes = {
    data: pt.array.isRequired,
    children: pt.any.isRequired,
    onItemSelect: pt.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const { data } = this.props;

    return (
      <div
        className="group-menu"
      >
        {
          data.map(group =>
            <div
              key={group.value}
              className={group.value}
            >
              <h3>{group.label}</h3>
              {
                group.options.map((option, index) =>
                  <div
                    key={index}
                    onClick={() => {
                      this.props.onItemSelect(group, option);
                    }}
                  >
                    { option.label || option.value }
                  </div>
                )
              }
            </div>
          )
        }
      </div>
    );
  }
}
