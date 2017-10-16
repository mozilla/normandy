#!/usr/bin/env python
import os

import requests
from taskcluster import fromNow
from taskcluster.utils import stableSlugId, dumpJson

BASE_URL = 'http://taskcluster/queue/v1'

tasks = [
    {
        'name': 'recipe-client-addon:build_test',
        'description': (
            'Download mozilla-central, sync Normandy changes, build Firefox, and run Normandy '
            'tests'
        ),
        'command': 'normandy/recipe-client-addon/bin/tc/build_test.sh',
    },
    {
        'name': 'recipe-client-addon:lint',
        'description': 'Run lint checks on the add-on',
        'command': 'normandy/recipe-client-addon/bin/tc/lint.sh',
    },
    {
        'name': 'recipe-client-addon:make-xpi',
        'description': 'Build XPI for recipe-client-addon',
        'command': 'normandy/recipe-client-addon/bin/tc/make-xpi.sh',
    },
]


def main():
    _idMaker = stableSlugId()

    def idMaker(name):
        return _idMaker(name).decode()

    decisionTaskId = os.environ['TASK_ID']
    owner = os.environ['GITHUB_HEAD_USER_EMAIL']
    source = os.environ['GITHUB_HEAD_REPO_URL']

    with requests.Session() as session:
        for task in tasks:
            dependencies = [idMaker(name) for name in task.get('dependencies', [])]
            dependencies.append(decisionTaskId)

            env = task.get('env', {})
            for key, val in os.environ.items():
                if key.startswith('GITHUB_'):
                    env.setdefault(key, val)

            for spec in task.get('artifacts_from', []):
                task_id = idMaker(spec['task_name'])
                path = spec['path']
                env[spec['env_var']] = f'{BASE_URL}/task/{task_id}/artifacts/{path}'

            task_id = idMaker(task['name'])
            res = session.put(f'{BASE_URL}/task/{task_id}', data=dumpJson({
                'metadata': {
                    'name': task['name'],
                    'description': task['description'],
                    'owner': owner,
                    'source': source,
                },
                'provisionerId': 'aws-provisioner-v1',
                'workerType': 'gecko-1-b-linux',
                'schedulerId': 'taskcluster-github',
                'taskGroupId': decisionTaskId,
                'created': fromNow('0 seconds'),
                'deadline': fromNow('1 day'),
                'expires': fromNow('365 days'),
                'payload': {
                    'image': 'mozilla/normandy-taskcluster:2017-10-16',
                    'command': [
                        '/bin/bash',
                        '-c',
                        ' && '.join([
                            'apt-get update',
                            'apt-get install -y git',
                            'mkdir /artifacts',
                            'cd ~',
                            'git clone $GITHUB_HEAD_REPO_URL normandy',
                            'pushd normandy',
                            'git checkout $GITHUB_HEAD_SHA',
                            'popd',
                            task['command'],
                        ])
                    ],
                    'maxRunTime': 28800,  # 8 hours
                    'env': env,
                    'artifacts': {
                        'public': {
                            'type': 'directory',
                            'path': '/artifacts',
                            'expires': fromNow('364 days'),  # must expire before task
                        },
                    },
                    'features': {
                        'taskclusterProxy': True,
                    },
                },
                'dependencies': dependencies,
            }))
            print(res.text)
            res.raise_for_status()


if __name__ == '__main__':
    main()
