# Lints

This is a unified linting tool for all Normandy project.

# Usage

The lints are run in a Docker container which sets up all tools needed. To
provide the code to lint, mount it as a Docker volume at ``/app/code`. The
default command for the Dockerfile is the lint tool.

```shell
$ docker build -t lint  .
$ docker run -v $CODE_TO_LINT:/app/code lint
```

The directory mounted must be a git repo, as git information is used to find
files to lint. It must contain a `.therapist.yml` config file.

# Implementation

All lints are run and managed through [Therapist][]. The lints currently run are:

* flake8 - For Python files
* eslint - for JS and JSX files. Local .eslintrc files are respected.
* stylelint - For CSS and SCSS files. Local .stylelint files are respected.

[Therapist]: https://github.com/rehandalal/therapist
