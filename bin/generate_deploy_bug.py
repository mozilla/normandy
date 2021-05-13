#!/usr/bin/env python
import argparse
import ast
import re
import logging
import logging.config
import sys

from pydriller import Repository
from pydriller.domain.commit import ModificationType

# TODO Potential future improvements:
#   * Summarize weekly dependency updates
#   * Use a real template instead of that print mess
#   * Open bugzilla with form pre-filled


PR_URL_TMPL = "https://github.com/mozilla/normandy/pull/{}"
log = logging.getLogger("normandy.generate_deploy_bug")


def get_pr_numbers(commit):
    summary = commit.msg.split("\n")[0]
    matches = re.findall(r"#\d+", summary)
    return [int(m[1:]) for m in matches]


def get_pr_title(commit, pr_num):
    bors_message_regex = re.compile(
        rf"^{pr_num}: (?P<message>.*)( [ra]=[^ ]*){{2,}}$", re.MULTILINE
    )
    green_button_message_regex = re.compile(
        rf"^Merge pull request #{pr_num} from.*\n\n(?P<message>.*)$", re.MULTILINE
    )

    match = bors_message_regex.search(commit.msg)
    if not match:
        match = green_button_message_regex.search(commit.msg)
        if match:
            log.warning(
                f"Green-button style merge found for PR {pr_num}, expected bors-style merge"
            )

    if not match:
        log.error(f"Could not determine title for PR {pr_num}. Bailing.")
        raise ValueError(f"Could not determine PR title for {pr_num}")
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
    parser.add_argument("--verbose", "-v", action="count", default=0)
    args = parser.parse_args()

    log_level = logging.WARNING
    if args.verbose >= 2:
        log_level = logging.DEBUG
    elif args.verbose >= 1:
        log_level = logging.INFO

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {"development": {"format": "%(levelname)s %(name)s: %(message)s"}},
            "handlers": {
                "console": {
                    "level": "DEBUG",
                    "class": "logging.StreamHandler",
                    "stream": sys.stderr,
                    "formatter": "development",
                }
            },
            "root": {"handlers": ["console"], "level": "WARNING"},
            "loggers": {
                "normandy": {"propagate": False, "handlers": ["console"], "level": log_level}
            },
        }
    )

    pr_commits = []
    dependency_updates = []
    migrations = []

    repo = Repository(".", from_tag=args.from_tag, to_tag=args.to_tag)
    num_commits_processed = 0
    for commit in repo.traverse_commits():
        for mod in commit.modified_files:
            if mod.change_type == ModificationType.ADD and "/migrations/" in mod.new_path:
                migrations.append(get_migration_desc(mod))

        if not commit.merge:
            log.debug(f"Skipping {commit.hash[:7]}: Not a merge")
            # Not a PR merge
            continue
        commit.prs = get_pr_numbers(commit)
        if not commit.prs:
            log.debug(f"Skipping {commit.hash[:7]}: No PR numbers")
            continue

        if is_dependency_update(commit):
            log.debug(f"Processing commit {commit.hash[:7]} as dependency commit")
            dependency_updates.append(commit)
        else:
            log.debug(f"Processing commit {commit.hash[:7]} as normal commit")
            pr_commits.append(commit)
        num_commits_processed += 1

    if num_commits_processed == 0:
        log.error("No commits processed")
        raise Exception("No commits processed")

    # Accrue output in a buffer and print all at once so that log lines don't pollute it
    output = ""

    def output_line(line=""):
        nonlocal output
        output += line + "\n"

    output_line(f"# Version {args.to_tag}")
    output_line()
    output_line(f"## PRs merged since {args.from_tag}")
    output_line()

    if not pr_commits:
        output_line("None")

    for commit in pr_commits:
        for pr in commit.prs:
            output_line(f"* [PR {pr}]({PR_URL_TMPL.format(pr)}): {get_pr_title(commit, pr)}")

    output_line()
    output_line("## Dependency updates")
    output_line()

    if not dependency_updates:
        output_line("None")

    for commit in dependency_updates:
        for pr in commit.prs:
            output_line(f"* [PR {pr}]({PR_URL_TMPL.format(pr)}): {get_pr_title(commit, pr)}")

    output_line()
    output_line("## Migrations")
    output_line()

    if not migrations:
        output_line("None")

    for migration in migrations:
        output_line(f"* {migration['path']} - {migration['description']}")

    print(f"\n\n{output}")


if __name__ == "__main__":
    main()
