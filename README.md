# monorepo-turbo-changeset-poc

A Turborepo + Changesets monorepo POC with 5 packages, wired for Harness CI so
that PRs and releases only build/verify/release the packages that changed.

## Packages & dependency graph

```
packages/
  package-a   depends on -> package-b
  package-b   depends on -> package-c
  package-c   base (no deps)
  package-d   depends on -> package-e
  package-e   base (no deps)
  package-f   independent
```

```
package-a ──► package-b ──► package-c

package-d ──► package-e

package-f        (standalone)
```

Each package exposes two commands, run through Turbo:

- `build` — compiles `src/` → `dist/` (see `scripts/build.mjs`)
- `test`  — imports the built output and asserts its `run()` contract

## Tooling

- **pnpm workspaces** (`pnpm-workspace.yaml`) — links `@fsou1/*` packages.
- **Turbo** (`turbo.json`) — task graph + caching. `build` runs `^build`
  first, so `package-b` always builds before `package-a` / `package-c`.
- **Changesets** (`.changeset/`) — versioning + publishing. `changeset publish`
  only publishes packages whose version was bumped.

## Local usage

```bash
corepack enable            # provides pnpm without a global install
pnpm install
pnpm build                 # turbo run build  (all packages)
pnpm test                  # turbo run test   (all packages)
pnpm ci:affected           # turbo run build test --affected

# record a release intent (pick packages + bump type):
pnpm changeset
```

## Branch & release model

- **`main`** — the trunk. Long-lived.
- **Feature PR:** branch off `main` → open PR → merge to `main`.
- **Release:** cut a **`publish`** branch from `main` → run the release
  process on it → merge `publish` back into `main`.

```
feature/x ──PR──► main ──cut──► publish ──release + merge back──► main
```

## How "only changed packages" works

Turbo's `--affected` flag selects packages that changed on the current branch
**plus their dependents**. So editing `package-c` selects `package-c`,
`package-b`, and `package-a`; editing `package-e` selects `package-e` and
`package-d`; editing `package-f` selects only `package-f`.

- **PR (target = `main`):** diff against the PR's target branch
  → `TURBO_SCM_BASE=origin/main turbo run build test --affected`
- **Release (on `publish`):** diff against the previous release tag
  → `TURBO_SCM_BASE=<last-tag> turbo run build test --affected`,
  then `changeset publish` releases only the bumped packages.

> Turbo has no `--affected-base` flag; the comparison base (and head) come from
> the `TURBO_SCM_BASE` / `TURBO_SCM_HEAD` environment variables.

## Harness

Pipelines live in `.harness/` (import them via *Pipeline → Import From Git*, or
paste the YAML into the pipeline editor):

| File | Purpose |
| --- | --- |
| `.harness/pr-pipeline.yaml` | On PR into `main`: install, then build+test **affected** packages vs the target branch. |
| `.harness/release-pipeline.yaml` | **Run manually** against `publish`: install → build+test **affected** (vs last tag) → `changeset version` + commit → `changeset publish` → push bump + tags back to `publish`. |
| `.harness/triggers/pr-trigger.yaml` | GitHub PR-into-`main` webhook trigger. |

Both pipelines inline the same install + affected build/test steps (the diff
base differs: PR uses the target branch, release uses the previous release tag).

Both pipelines run on **Harness Cloud** (no Kubernetes/Docker connector
needed) and cache the pnpm store + `.turbo` between runs.

### Release types

The manual release pipeline takes a `RELEASE_TYPE` input:

| `RELEASE_TYPE` | Versions | npm dist-tag | How |
| --- | --- | --- | --- |
| `release` (default) | `x.y.z` | `latest` | exits pre mode if active, then version + publish |
| `prerelease` | `x.y.z-rc.N` | `rc` | `changeset pre enter rc`, then version + publish |

Changesets' [pre mode](https://github.com/changesets/changesets/blob/main/docs/prereleases.md)
drives both the `-rc.N` suffix and the `rc` dist-tag automatically (no `--tag`
needed). State lives in `.changeset/pre.json`, which is committed and pushed
back on `publish` so successive prereleases keep incrementing (`rc.0`, `rc.1`…).

### Release flow, end to end

1. Cut `publish` from `main` and push it.
2. **Manually run the `monorepo-release` pipeline** and choose `RELEASE_TYPE`
   (`release` or `prerelease`). It defaults to the `publish` branch.
3. The pipeline enters/exits pre mode as needed, bumps versions
   (`changeset version`), commits, builds+tests only affected packages, then
   `changeset publish` publishes only the bumped packages (under `latest` or
   `rc`) and tags them.
4. The pipeline pushes the bump commit + tags back to `publish`.
5. **You merge `publish` → `main`** to bring the version bumps, changelogs,
   and tags home.

> Typical cadence: run `prerelease` a few times to ship `rc` builds, then run
> `release` once to cut the stable version (which exits pre mode for you).

### Before importing, replace these placeholders

- `YOUR_ORG`, `YOUR_PROJECT` — your Harness org / project identifiers.
- `YOUR_GIT_CONNECTOR` — a Harness Git (GitHub) connector.
- `YOUR_GH_ORG` (release pipeline `REPO_SLUG` variable) — your GitHub org.
- Harness secret **`npm_token`** — npm automation token (publish).
- Harness secret **`git_token`** — GitHub PAT with write access (push bump + tags).
