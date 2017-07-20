/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

window.ShieldStudies = class ShieldStudies extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      learnMoreHref: null,
    };

    this.handleClickUpdatePreferences = this.handleClickUpdatePreferences.bind(this);
  }

  componentDidMount() {
    remoteValues.ShieldLearnMoreHref.subscribe(this);
  }

  componentWillUnmount() {
    remoteValues.ShieldLearnMoreHref.unsubscribe(this);
  }

  receiveRemoteValue(name, value) {
    this.setState({
      learnMoreHref: value,
    });
  }

  handleClickUpdatePreferences() {
    sendPageEvent("NavigateToDataPreferences");
  }

  render() {
    return (
      r("div", {},
        r(InfoBox, {},
          r("span", {}, "What's this? Firefox may install and run studies from time to time."),
          r("a", {href: this.state.learnMoreHref}, "Learn more"),
          r(FxButton, {onClick: this.handleClickUpdatePreferences}, "Update Preferences"),
        ),
        r(StudyList),
      )
    );
  }
};

class StudyList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      studies: [],
    };
  }

  componentDidMount() {
    remoteValues.StudyList.subscribe(this);
  }

  componentWillUnmount() {
    remoteValues.StudyList.unsubscribe(this);
  }

  receiveRemoteValue(name, value) {
    // Convert date strings to dates.
    const studies = value.map(study => {
      study.studyStartDate = stringToDate(study.studyStartDate);
      study.studyEndDate = stringToDate(study.studyEndDate);
      return study;
    });

    // Sort by active status, then by start date.
    studies.sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      return a.studyStartDate - b.studyStartDate;
    });

    this.setState({studies});
  }

  render() {
    return (
      r("ul", {className: "study-list"},
        this.state.studies.map(study => (
          r(StudyListItem, {key: study.name, study})
        ))
      )
    );
  }
}

class StudyListItem extends React.Component {
  constructor(props) {
    super(props);
    this.handleClickRemove = this.handleClickRemove.bind(this);
  }

  handleClickRemove() {
    sendPageEvent("RemoveStudy", this.props.study.name);
  }

  render() {
    const study = this.props.study;
    return (
      r("li", {className: classnames("study", {disabled: !study.active})},
        r("div", {className: "study-icon"},
          study.name.slice(0, 1)
        ),
        r("div", {className: "study-details"},
          r("div", {className: "study-name"}, study.name),
          r("div", {className: "study-description", title: study.description},
            r("span", {className: "study-status"}, study.active ? "Active" : "Complete"),
            r("span", {}, "\u2022"), // &bullet;
            r("span", {}, study.description),
          ),
        ),
        r("div", {className: "study-actions"},
          study.active &&
            r(FxButton, {onClick: this.handleClickRemove}, "Remove"),
        ),
      )
    );
  }
}
