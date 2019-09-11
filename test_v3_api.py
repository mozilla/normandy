#!/usr/bin/env python

import argparse
import pytest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Normandy v3 API tests")
    parser.add_argument(
        "--env",
        dest="env",
        action="store",
        default="",
        help="Target environment for tests -- choose one of 'staging' or 'production'",
    )
    args = parser.parse_args()

    if args.env not in ["staging", "production"]:
        print("You must choose one of staging or production for the target environment")
        exit(1)

    print("Running v3 API tests in {}".format(args.env))
    tavern_file = "api-tests/test_v3.{}.tavern.yaml".format(args.env)
    pytest.main([tavern_file])
    exit(0)
