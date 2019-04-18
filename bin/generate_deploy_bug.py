#!/usr/bin/env python
import argparse
import ast
import re

from pydriller import RepositoryMining
from pydriller.domain.commit import ModificationType

# TODO Potential future improvements:
#   * Summarize weekly dependency updates
#   * Use a real template instead of that print mess
#   * Open bugzilla with form pre-filled


PR_URL_TMPL = "https://github.com/mozilla/normandy/pull/{}"


def get_pr_numbers(commit):
    summary = commit.msg.split("\n")[0]
    matches = re.findall(r"#\d+", summary)
    return [int(m[1:]) for m in matches]


def get_pr_title(commit, pr_num):
    message_regex = re.compile(rf"^{pr_num}: (?P<message>.*)( [ra]=[^ ]*){{2,}}$", re.MULTILINE)
    match = message_regex.search(commit.msg)
    assert match
    return match.group("message")


def get_migration_desc(modification):
    description = None
    try:
        with open(modification.new_path) as f:
            module = ast.parse(f.read())
            description = ast.get_docstring(module)
    except IOError:
        pass

    if not description:
        description = "TODO"

    return {"path": re.sub(r"^normandy/", "", modification.new_path), "description": description}


def is_dependency_update(commit):
    """Heuristics to detect automated package updates"""

    patterns = ["update", "upgrade", "dependency", "docker digest", r"\d+\.\d+"]

    score = 0
    printed_msg = False
    for pattern in patterns:
        if re.search(r"^\d+: .*" + pattern, commit.msg, re.IGNORECASE | re.MULTILINE):
            if not printed_msg:
                printed_msg = True
            score += 1

    return score >= 2


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("from_tag")
    parser.add_argument("to_tag")
    args = parser.parse_args()

    pr_commits = []
    dependency_updates = []
    migrations = []

    mine = RepositoryMining(".", from_tag=args.from_tag, to_tag=args.to_tag)
    for commit in mine.traverse_commits():
        for mod in commit.modifications:
            if mod.change_type == ModificationType.ADD and "/migrations/" in mod.new_path:
                migrations.append(get_migration_desc(mod))

        if not commit.merge:
            # Not a PR merge
            continue
        commit.prs = get_pr_numbers(commit)
        if not commit.prs:
            continue

        if is_dependency_update(commit):
            dependency_updates.append(commit)
        else:
            pr_commits.append(commit)

    # output

    print(f"# Version {args.to_tag}")
    print()
    print(f"## PRs merged since {args.from_tag}")
    print()

    if not pr_commits:
        print("None")

    for commit in pr_commits:
        for pr in commit.prs:
            print(f"* [PR {pr}]({PR_URL_TMPL.format(pr)}): {get_pr_title(commit, pr)}")

    print()
    print("## Dependency updates")
    print()

    if not dependency_updates:
        print("None")

    for commit in dependency_updates:
        for pr in commit.prs:
            print(f"* [PR {pr}]({PR_URL_TMPL.format(pr)}): {get_pr_title(commit, pr)}")

    print()
    print("## Migrations")
    print()

    if not migrations:
        print("None")

    for migration in migrations:
        print(f"* {migration['path']} - {migration['description']}")


if __name__ == "__main__":
    main()
