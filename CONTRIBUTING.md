# Contributing Guide

Thanks for choosing to contribute! Feel free to make a pull request with any changes.

## Development

### Setup

- [pnpm](https://pnpm.io/) is used for dependency management. The specific version can be found in [`package.json`](./package.json). You may find steps to install it here: <https://pnpm.io/installation>.
- Install dependencies with `pnpm install`.
- To register Git hooks with [lefthook](https://lefthook.dev/), run `lefthook install`.
- Run `pnpm build` to build the package.

### Testing

[Vitest](https://vitest.dev) is used for testing. Run `pnpm test` to start the test runner. Tests are run in headless Chromium via [Vitest browser mode](https://vitest.dev/guide/browser/).

### Coding conventions

- The code is linted with [Oxlint](https://oxc.rs/docs/guide/usage/linter.html). You can run it with `pnpm lint`.
- The code is formatted with [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html). You can run it with `pnpm format`.
- Please adhere to the [Conventional Commits](https://www.conventionalcommits.org) specification for authoring commit messages.
