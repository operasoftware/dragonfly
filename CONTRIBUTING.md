# How to Contribute

## Getting Started
* Before starting to work on a feature, it's a good idea to file an issue in the
  [issue tracker](https://github.com/operasoftware/dragonfly/issues) to discuss
  the feature with the team.
* Fork and create a branch off of 'master'.

## Before Submitting
* Make sure the code follows the [style guide](https://github.com/operasoftware/dragonfly/wiki/Code-style-guide).
* Optionally install the [Dragonfly build tools](https://github.com/operasoftware/dragonfly-build-tools)
  and run `df2 cleanrepo`. This will normalize whitespace, add BOMs to all files (needed for the build script)
  and sort all UI strings.
* Add tests if applicable.
* Add your name to AUTHORS.

## Submitting Changes
Since we don't want to integrate everything directly into 'master', our workflow
for getting a branch reviewed is the following:
* File an issue in the [issue tracker](https://github.com/operasoftware/dragonfly/issues)
  requesting a review branch. Provide the name of your branch.
* E.g., if your branch is named 'redesigned_everything', we will create a 'redesigned_everything_reviewed'
branch.
* Send a pull request against this branch.
* The code will be reviewed by the team.

Once done, the feature will be tested. If all tests are passing, the code will be
integrated.

Thanks in advance.

