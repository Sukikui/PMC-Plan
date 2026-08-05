# Code Quality Checks

The repository combines runtime test coverage with static usage analysis. These
checks answer different questions and are both required.

## Test coverage

`npm run test:coverage` runs the complete Jest suite and collects coverage from
the application source under `app/`, `components/`, and `lib/`, plus root
application entry points. Declaration files, dependencies, generated Next.js
output, and coverage reports are excluded.

Reports are written to `coverage/` in text, JSON summary, LCOV, and HTML formats.
The global thresholds in `jest.config.cjs` represent the measured repository
baseline. They prevent coverage regressions and should only be increased as new
tests are added. They are not a claim that every behavior is already tested.

## Static usage analysis

`npm run check:unused` first runs Knip against the Next.js application, tests,
and tooling entry points. It fails when it finds unused source files, exports,
dependencies, or unresolved imports. A second production-only pass excludes
tests and rejects files, exports, and dependencies that are reachable only from
the test graph. Internal production helpers may remain exported when their
behavior is tested directly.

TypeScript additionally rejects unused locals, parameters, labels, and
syntactically unreachable code, so dead implementation details cannot remain
hidden inside otherwise referenced modules.

## Complete local check

Run the complete quality gate with:

```bash
npm run check:quality
```

GitHub Actions runs linting, type checking, static usage analysis, and full Jest
coverage for every pull request targeting the maintained branches. The generated
coverage report is retained as a workflow artifact for inspection.

Static analysis proves that code is reachable from a recognized entry point; it
does not prove that every runtime path is exercised. Coverage measures test
execution; it does not prove behavioral correctness. Keeping both checks enabled
prevents dead-code growth while making untested areas visible.
