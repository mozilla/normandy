#!/usr/bin/env python
import os

import requests
from taskcluster import fromNow
from taskcluster.utils import stableSlugId, dumpJson

tasks = [
    {
        'name': 'recipe-client-addon:build',
        'description': 'Build Firefox with recipe-client-addon',
        'command': 'normandy/recipe-client-addon/bin/tc/build.sh',
    },
    {
        'name': 'recipe-client-addon:test',
        'description': 'Test recipe-client-addon with gecko-dev',
        'command': 'normandy/recipe-client-addon/bin/tc/test.sh',
        'dependencies': ['recipe-client-addon:build'],
        'artifacts_from': {
            'BUILD_RESULT': {'task': 'recipe-client-addon:build', 'path': 'build.tar.gz'},
        },
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

            for envvar, artifact in task.get('artifacts_from', {}).items():
                taskId = idMaker(artifact['task'])
                path = artifact['path']
                env[envvar] = f'http://taskcluster/queue/v1/task/{taskId}/artifacts/{path}'

            task_id = idMaker(task['name'])
            res = session.put(f'http://taskcluster/queue/v1/task/{task_id}', data=dumpJson({
                'metadata': {
                    'name': task['name'],
                    'description': task['description'],
                    'owner': owner,
                    'source': source,
                },
                'provisionerId': 'aws-provisioner-v1',
                'workerType': 'github-worker',
                'schedulerId': 'taskcluster-github',
                'taskGroupId': decisionTaskId,
                'created': fromNow('0 seconds'),
                'deadline': fromNow('4 hours'),
                'expires': fromNow('365 days'),
                'payload': {
                    'image': 'mozilla/normandy-taskcluster:latest',
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
                    'maxRunTime': 14400,  # 4 hours
                    'env': env,
                    'artifacts': {
                        'public': {
                            'type': 'directory',
                            'path': '/artifacts',
                            'expires': fromNow('364 days'),  # must expire before task
                        },
                    },
                },
                'dependencies': dependencies,
            }))
            print(res.text)
            res.raise_for_status()


if __name__ == '__main__':
    main()
