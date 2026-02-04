## Installation

Running `yarn install` in the root directory will install NPM packages for all service.

See individual READMEs under `/services/` for specifics for each service


## Available Services

- `services/admin/` runs our internal customer admin dashboard.
- `services/api/` is the GraphQL API that backs every frontend service.
- `services/dashboard/` is the UI for customers to upload data sources and manage reports.
- `services/slack/` is the slack bot, which talks to the API.
- `services/pulse/` is the UI for pulse AI chat.
- `services/unstructured/` is the service for parsing different file formats from S3 into Pinecone.

There are also several Typescript libraries under `lib/` which contain common GraphQL queries and UI components.

All of the infrastructure is managed by terraform under `infrastructure/`


## Commit messages and Semantic Versioning

Zunou uses [Semantic Release](https://github.com/semantic-release/semantic-release) for versioning. The version number is updated automatically by GitHub Actions, when you merge into the staging or production branches. A Github release is automatically created when a new production version is released.

In order for this to work, your commit messages should follow the [Conventional Commits](https://www.conventionalcommits.org/) standard. No release will be created unless there is at least one `fix:` or `feat:` commit, since those are required to bump the semantic version.

Run `husky install` to install a git hook to enforce this commit message standard.


# Development Workflow

- All non-trivial changes should be made in a Pull Request. This helps to group changes together, and identify the purpose of individual commits.
- It is preferable to do rebase commits when merging Pull Requests, to keep a linear history and make future rebasing easier.
- Run `make open-pr` to open a new pull request (it will prompt you for a title).
- In addition to the [Conventional Commits](https://www.conventionalcommits.org/) standard discussed above, it is preferable to include the PR number in your commit message, to make it easy to scan groups of commits. Using `make open-pr` helps here, because it include an initial commit for you with the PR number. Github UI auto-links commit messages to PRs if you use the format `[#123]`. A good commit message looks something like:
    `git commit -m "fix(admin): [#122] fix CDN speed issues"`
- It is preferable to include the scope in the commit message (eg. `(admin)`, `(api)` or `(global)`).
- Run `make format` to format code and auto-fix linting errors.


## Performing releases

Releases are built and pushed automatically by GitHub Actions, when you merge into the staging or production branches.

To create a staging release, run `make stage-release`. That will create a pull request on Github, with the appropariate target. When merged, the staging branch tag will be updated with the new version number, and Docker images will be created and pushed to AWS for any services that have changed.

To create a production release, run `make release`. This behaves similarly to `make stage-release`. 

