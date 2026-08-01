# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

Run `pnpm changeset` to record an intent-to-release. Each changeset is a small
markdown file describing which packages changed and at what semver bump. On
release, `changeset version` consumes them (bumping versions + writing
changelogs) and `changeset publish` publishes only the packages that were
bumped.
