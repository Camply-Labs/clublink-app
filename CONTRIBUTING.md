# Contributing to ClubLink

Thank you for your interest in contributing to **ClubLink**, an open-source ERP for Pathfinder Club management, maintained by **Camply**. We welcome contributions from the community and are glad to have you here.

Please read this document carefully before submitting any contribution.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Project Overview](#project-overview)
- [Intellectual Property & Contributor Agreement](#intellectual-property--contributor-agreement)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Branch Naming](#branch-naming)
- [Review Process](#review-process)
- [License](#license)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

---

## Project Overview

ClubLink is an Angular v19 application that connects directly to Firebase. It was built to serve as an internal management tool for a single Pathfinder Club — with **Clube de Desbravadores Garras de Águia** as the original use case — but is designed to be easily customizable and self-deployable by any club that wishes to use it.

This is a **single-tenant ERP**: each club runs its own deployment. There is no central shared instance.

Key technologies:

- **Framework:** Angular v19
- **Backend/Database:** Firebase (Firestore, Authentication, Storage, etc.)
- **License:** GNU Affero General Public License v3.0 (AGPLv3)

---

## Intellectual Property & Contributor Agreement

> **Please read this section carefully before contributing.**

By submitting any contribution to ClubLink — including but not limited to code, documentation, translations, design assets, bug reports with proposed fixes, or any other material — **you agree to the following terms:**

1. **Assignment of Rights:** You irrevocably assign and transfer to **Camply** all rights, title, and interest in your contribution, including all intellectual property rights (copyright, patent rights, and related rights), worldwide and in perpetuity.

2. **Commercial Use:** Camply, its successors, or any entity authorized by Camply, reserves the right to use, sublicense, sell, or otherwise commercialize the project — including your contributions — under any license or commercial arrangement, at any time and without additional notice or compensation to contributors.

3. **Representation:** You represent that your contribution is your original work, that you have the right to make the assignment above, and that your contribution does not violate any third-party rights.

4. **No Obligation:** Camply is under no obligation to use, maintain, or credit your contribution, though attribution may be given at the maintainers' discretion.

5. **Trademark:** **ClubLink** is a registered brand and trademark of **Camply**. All rights to the name, logo, and brand identity are reserved. Contributors may not use the ClubLink brand in derivative works without explicit written permission from Camply.

If you do not agree with these terms, please do not submit contributions to this repository.

---

## How to Contribute

### Reporting Bugs

Before opening a bug report, please:

1. Search existing [Issues](../../issues) to avoid duplicates.
2. Make sure the bug is reproducible on the latest version of the `main` branch.

When opening an issue, use the **Bug Report** template and include:

- A clear and descriptive title
- Steps to reproduce the behavior
- Expected vs. actual behavior
- Angular version, Firebase SDK version, browser, and OS
- Relevant console errors or screenshots (avoid including sensitive data)

### Suggesting Features

Feature requests are welcome. Before submitting:

1. Check [Issues](../../issues) and [Discussions](../../discussions) for similar proposals.
2. Open a **GitHub Discussion** under the *Ideas* category to gather community feedback before opening a formal issue.

When proposing a feature, describe:

- The problem it solves
- How it fits ClubLink's goal (internal club management, single-tenant, self-deployable)
- Whether it should be a core feature or a configurable/optional module

### Submitting Pull Requests

1. Fork the repository and create your branch from `main`.
2. Follow the [Development Setup](#development-setup) instructions.
3. Ensure your changes pass all linting and build checks.
4. Write or update tests where applicable.
5. Open a Pull Request against `main` with a clear description of what was changed and why.
6. Reference the related issue number in the PR description (e.g., `Closes #42`).
7. Be responsive to feedback during the review process.

PRs that do not follow the coding standards or that break existing functionality will not be merged.

---

## Development Setup

```bash
# 1. Clone your fork
git clone https://github.com/Camply-Labs/clublink-app.git
cd clublink

# 2. Install dependencies
npm install

# 3. Configure Firebase
# Copy the environment template and fill in your Firebase project credentials
cp src/environments/environment.ts src/environments/environment.development.ts

# 4. Start the development server
npm run start
```

> **Note:** You will need your own Firebase project for local development. Never commit real Firebase credentials to the repository.

---

## Coding Standards

- Follow the [Angular Style Guide](https://angular.dev/style-guide) strictly.
- Use **TypeScript** with strict mode enabled.
- Components must be **standalone** (Angular v19 default).
- Avoid any direct DOM manipulation; prefer Angular's reactive patterns.
- Keep Firebase interactions encapsulated in services — never call Firebase directly from components.
- All new features must be behind environment flags if they may not apply to all clubs.
- Run `ng lint` before submitting any PR. PRs with linting errors will not be reviewed.

---

## Commit Message Guidelines

Use the [Conventional Commits](https://www.conventionalcommits.org/) specification with issue-number for identification:

```
<type>({issue-number}): <short description>

[optional body]

[optional footer, e.g., Closes #{issue-number}]
```

**Types:**

| Type       | When to use                                      |
|------------|--------------------------------------------------|
| `feat`     | A new feature                                    |
| `fix`      | A bug fix                                        |
| `docs`     | Documentation changes only                       |
| `style`    | Formatting, missing semicolons, etc. (no logic)  |
| `refactor` | Code restructuring without feature/fix changes   |
| `test`     | Adding or updating tests                         |
| `chore`    | Build process, tooling, dependency updates       |

**Example:**

```
feat(0001): add member status filter to list view

Closes #1
```

---

## Branch Naming

| Pattern                | Purpose                        |
|------------------------|--------------------------------|
| `feat/{issue-number}`    | New feature                    |
| `fix/{issue-number}`     | Bug fix                        |
| `docs/{issue-number}`    | Documentation update           |
| `refactor/{issue-number}`| Refactoring                    |
| `chore/{issue-number}`   | Tooling/dependency changes     |

**Example:**

```
git switch -c feat/0001

Issue #1
```


---

## Review Process

- All PRs require at least **one approval** from a project maintainer before merging.
- Maintainers may request changes, ask for tests, or close PRs that are out of scope.
- Large features should be discussed in a GitHub Discussion before a PR is opened.
- The maintainers' decisions on merging are final.

---

## License

By contributing to ClubLink, you agree that your contributions will be governed by the terms described in the [Intellectual Property & Contributor Agreement](#intellectual-property--contributor-agreement) section above, and that the project is distributed under the [GNU Affero General Public License v3.0](./LICENSE).

**ClubLink™ is a trademark of Camply. All rights reserved.**
