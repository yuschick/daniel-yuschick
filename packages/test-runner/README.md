# `@dy/test-runner`

The DY Design System's test report: one screen that shows every package's suites, their results and their coverage. It's in progress; this README grows with it.

## How it works

Running tests and reporting them are separate jobs.

1. **Each package runs its own tests** with its own runner (`node --test`, Vitest, or Vitest in the browser for Storybook) and adds a reporter that writes a small results file to `.test-results/<suite>.json`.
2. **Turbo runs the packages** and caches `.test-results/` as each `test` task's output. Turbo only replays a result when nothing that could change it has changed, so a cached result is still a real, current result.
3. **The renderer reads the results files** and draws the report. _(Not built yet.)_

`turbo run test` keeps working on its own, for CI and for raw output.

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
"test": "node --test --experimental-test-coverage --test-coverage-exclude='**/*.test.js' --test-reporter=spec --test-reporter-destination=stdout --test-reporter=@dy/test-runner/node-reporter --test-reporter-destination=stdout"
```

`spec` keeps the readable output; the second reporter writes `.test-results/node.json` itself, because Node won't create a missing folder for a reporter destination. Node loads a reporter from its default export, so `src/reporters/` is exempt from RX-04's named-exports rule, the same way `*.config.js` files are.

`@dy/configs` points at the reporter by relative path instead of depending on this package, because this package already depends on `@dy/configs` for its ESLint config.
