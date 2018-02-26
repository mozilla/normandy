#!/usr/bin/env bash
set -eu

if [[ $# -eq 0 ]]; then
    echo "USAGE: $0 STEP [ARGS]"
    exit 1
fi

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"
PROJECTS=(
    recipe-server
    mock-recipe-server
    compose
    mozjexl
)

count=0
step=$1
shift 1

num_errors=0

for project in "${PROJECTS[@]}"; do
    step_script="${BASE_DIR}/${project}/bin/ci/${step}"
    if [[ -f "${step_script}" ]]; then
        count=$((count + 1))
        echo "============================================================"
        echo "Running ${step} for ${project} (${count})"
        echo "============================================================"

        pushd ${BASE_DIR}/${project}
        "${step_script}" "$@" | cat
        # check exit code of step_script, not cat
        if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
            num_errors=$((num_errors + 1))
            echo "FAIL: ${step} for ${project}"
        fi
        popd
    fi
done

if [[ $count -eq 0 ]]; then
    echo "No projects have step $step"
    exit 1
fi

exit $num_errors
