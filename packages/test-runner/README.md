# `@dy/test-runner`

The DY Design System's test report: one screen that shows every package's suites, their results and their coverage.

```sh
pnpm test            # run what changed, replay the rest from cache
pnpm test --force    # rerun every suite
pnpm test --plain    # no mark, for logs and screen readers
```

```text
@dy/design-system: Running test suites…

  ✓ @dy/configs            52 passed    99% lines   2.98s
  ✓ @dy/css                 5 passed  no coverage   0.48s
  ✓ @dy/icons · node       48 passed    84% lines   1.51s
  ✓ @dy/icons · vitest      4 passed   100% lines   1.19s
  ✓ @dy/react             168 passed    74% lines  cached
  ✓ @dy/storybook          82 passed    47% lines   9.88s
  …

  Test files:  50
       Tests:  467 passed (467)
    Duration:  16.32s, 1 of 8 suites cached

  ✓ All test suites passed!
```

Each row is one suite. A package with two runners gets a row for each, named by runner. Coverage is the share of the package's own lines its suite runs; Storybook's row covers `@dy/react`'s source, which its stories render. `cached` means Turbo replayed the suite's last run, because nothing it depends on has changed.

## How it works

Running tests and reporting them are separate jobs.

1. **Each package runs its own tests** with its own runner (`node --test`, Vitest, or Vitest in the browser for Storybook) and adds a reporter that writes a small results file to `.test-results/<suite>.json`.
2. **Turbo runs the packages** and caches `.test-results/` as each `test` task's output. Turbo only replays a result when nothing that could change it has changed, so a cached result is still a real, current result. Suites don't wait for each other's tests (no `^test`), only for the builds they need.
3. **The CLI reads the results** ([`src/cli.js`](src/cli.js)). It clears old results, runs `turbo run test --summarize` quietly, then builds the report from Turbo's run summary and the results files.

`turbo run test` keeps working on its own, for CI and for raw output.

The root `package.json` runs the CLI by path rather than depending on this package. Turbo hashes the source of every package the root depends on into _every_ task, so a dependency would rerun all the suites whenever the renderer changed.

### When something goes wrong

Every package with a `test` script gets a row, whatever happens, so a suite can't drop out of the report unnoticed:

| The row says       | Because                                                                        |
| :----------------- | :----------------------------------------------------------------------------- |
| `1 failed, …`      | A test failed. Its name, file and message follow under **Failures**.           |
| `did not finish`   | The suite crashed before writing results. The end of its log follows.          |
| `did not run`      | A build it needs failed, so Turbo never started it.                            |
| `build failed`     | That build, with the end of its log.                                           |
| `wrote no results` | The task passed, but nothing reported: a runner without the reporter wired in. |

A failing suite doesn't stop the others (`--continue=dependencies-successful`). The exit code is Turbo's.

## Color and accessibility

Status never depends on color alone: every row has a symbol and words. The brand colors in [`src/palette.js`](src/palette.js) are copies of the 500 shades from `@dy/tokens`, the shades that keep 3:1 against both light and dark terminal backgrounds. That's WCAG's minimum for non-text, so they color only the mark and the `✓` and `✗` symbols. Text stays in the terminal's own color, which always has contrast. [`src/palette.test.js`](src/palette.test.js) fails if a copy drifts from its token or loses contrast.

The mark in [`src/mark.js`](src/mark.js) is the logo's four slashes drawn by hand in blocks: two wide, one column per row, with a `░` shadow and rules after the mark in Kesko's runner by Ariel Salminen. Tracing the logo's exact geometry gives strokes that wobble between widths, so it's a drawing rather than a conversion.

Output that isn't a terminal is plain, with no mark: a screen reader or log reads the block characters as noise. `NO_COLOR` turns color off; chalk doesn't read it on its own, so the CLI does.

## The results file

Every suite writes the same shape (`schemaVersion` 1), defined in [`src/results.js`](src/results.js):

| Field        | Holds                                                                          |
| :----------- | :----------------------------------------------------------------------------- |
| `package`    | The package name, such as `@dy/tokens`                                         |
| `suite`      | The runner: `node`, `vitest` or `storybook`                                    |
| `files`      | Test files run                                                                 |
| `tests`      | `passed`, `failed`, `skipped` and `todo` counts                                |
| `durationMs` | The runner's own measure of its run                                            |
| `coverage`   | `lines`, `branches` and `functions` percentages, or `null` with no JS to cover |
| `failures`   | Each failed test's `name`, `file` and `message`                                |

Coverage counts only the package's own files. A test that imports another workspace package covers that package's code too, and counting it would score the same code twice.

## The `node --test` reporter

```json
"test": "dy-node-test"
```

`dy-node-test` runs `node --test` with the flags every package shares, from `src/node-test.js`: coverage of the package's own files, the `spec` reporter for people, and this reporter for the report. Any flags you add, such as `--test-timeout=30000`, go after the shared ones. The command finds the reporter by its own location, so it works from any package.

`spec` keeps the readable output; the second reporter writes `.test-results/node.json` itself, because Node won't create a missing folder for a reporter destination. Node loads a reporter from its default export, so `src/reporters/` is exempt from RX-04's named-exports rule, the same way `*.config.js` files are.

Node 24's `--experimental-config-file` could hold these flags instead, but it prints a warning on every run, and it looks up reporters from the folder the tests run in, which `@dy/configs` can't use.

`@dy/configs` runs the command by relative path (`node ../test-runner/src/bin/dy-node-test.js`) instead of depending on this package, because this package already depends on `@dy/configs` for its ESLint config. Its `turbo.json` lists this package's `src/` as an input, so its suite still reruns when the command or the reporter changes.

## The Vitest reporter

```js
import { ResultsReporter } from '@dy/test-runner/vitest-reporter';

// in defineConfig's `test`
reporters: ['default', new ResultsReporter({ suite: 'vitest' })],
coverage: { enabled: true, provider: 'v8', include: ['src/**/*.{ts,tsx}'], reporter: ['text-summary'] },
```

Vitest reports coverage before the run ends, so the reporter holds it and writes `.test-results/<suite>.json` once the run is over. Vitest filters coverage to `coverage.include`, which is how Storybook's suite covers `@dy/react` (with `allowExternal`).
