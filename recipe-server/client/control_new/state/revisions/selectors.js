/* eslint import/prefer-default-export: "off" */
import { getAction } from '../actions/selectors';

export function getRevision(state, id, defaultsTo = null) {
  const revision = state.app.revisions.items.get(id);

  if (revision) {
    const action = getAction(state, revision.getIn(['recipe', 'action_id']));

    return revision
      .setIn(['recipe', 'action'], action)
      .removeIn(['recipe', 'action_id']);
  }

  return defaultsTo;
}
