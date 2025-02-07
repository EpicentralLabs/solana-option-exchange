# Contributing Guidelines

Pull requests, bug reports, and all other forms of contribution are welcomed!

## Branch Naming

Please follow these naming conventions:

- Feature Branches: ```Feature/<feature-name>```
    - Example: ```Feature/option-lab-page```
- Patch Branches: ```Patch/<patch-name>```
    - Example: ```Patch/remve-template-message```
- Bug Fix Branches: ```Bugfix/<bugfix-name>```
    - Example: ```Bugfix/fix-loop```
- Release Branches: ```Release/<version>```
    - Example: ```Realease/1.0.1```

## Versioning

We follow [**Semeantic Versioning (SemVer)**](https://semver.org/) for versioning this project.

Given a version number MAJOR.MINOR.PATCH, increment the:

1. MAJOR version when you make incompatible API changes.
2. MINOR version when you add functionality in a backward compatible manner.
3. PATCH version when you make backward compatible bug fixes.

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

Example:
    - ```1.2.3-beta```
    - ```4.5.6-latest```

## Commenting Style

Write clear, concise comments above functions, classes, and complex logic to explain what and why the code does what it does.

Example:

```/solana-opx/src/hooks/usePageVisibility.ts```

```js
export function usePageVisibility() {
  // Initialize with true and update after mount
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Only access document after component mounts
    if (typeof document !== 'undefined') {
      setIsVisible(!document.hidden)

      const handleVisibilityChange = () => {
        setIsVisible(!document.hidden)
      }
```

## Pull Requests (PRs)

When submitting a PR, please ensure:

- **Pull request title** is descriptive of the change.
- Provide a detailed description in the PR template, including:
  - **What** the change does.
  - **Why** the change is needed.
  - Any **related issue** numbers (e.g. fixes #123).
  - Testing instructions if applicable.
- **PR reviews** are required before merging.
- Use **[Squash and Merge]** when merging your PR to keep the commit history clean. 

## Issues & Tagging

When creating issues or working on existing ones:

- Use the appropriate **labels** (e.g., bug, enhancement, documentation, etc.).
- If you're submitting a bug or feature request, provide as much detail as possible:
  - Steps to reproduce.
  - Expected behavior vs. actual behavior.
  - Screenshots or logs, if applicable.
- For any feature-related work, create a **feature request issue** before starting to ensure the change is needed and aligns with the project goals.

### Taging

- When referencing specific issues or PRs in commits or PR descriptions, include the issue number and a hyperlink to the issue: ```Fixes [#123](linkhere)```.
- In issues and PRs include priority-level tags such as ```low```, ```medium``` and ```high```.

## Code Reviews

- Reviewers should focus on correctness, readability, and adherence to the project's coing standards.
- Provide constructive feedbck and request changes if necessary.
- After approval, the PR author can merge the PR.

## Documentation

- Keep the documentation up to date with your changes, especially in the **README**.
- If your change adds new features or modifies existing functionality, update the related documentation.
