# Random Picker

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-random-picker/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-random-picker/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-random-picker/)

[日本語版 README](README.ja.md)

A lightweight single-HTML app for random picks, randomized order, balanced team splitting, and wheel spins from a simple one-item-per-line list.

## 🚀 Live demo

### [Open Random Picker on GitHub Pages](https://ttomohisa.github.io/htmlapps-random-picker/)

No installation or account is required. Enter or paste candidates, choose a mode, and run it immediately in the browser.

Candidate lists, saved lists, settings, and randomization are handled in the browser. The app does not send entered candidates to a server.

## Features

- Pick one or multiple candidates at random
- Optionally remove picked candidates from later draws
- Restore all candidates and immediately start another round after everyone has been picked
- Randomize the complete order of all candidates
- Reveal a randomized order one person at a time in the large presentation view
- Split candidates into balanced teams by either:
  - number of teams
  - people per team
- Spin an animated wheel and enlarge it while it is spinning
- Present pick, order, team, and wheel results in mode-specific large views
- Copy results in a format tailored to the current mode
- Share results with the browser share sheet when available
- Keep a draw history
- Save multiple named candidate lists in the browser
- Automatically restore the current list and settings on the next visit
- Detect multi-column spreadsheet / Excel paste and choose which column to use
- Keep duplicate labels as separate candidates unless you explicitly remove duplicates
- Trim whitespace, remove blank lines, and remove duplicates with Undo
- Japanese and English UI in the same HTML
- Embedded SVG favicon
- No third-party runtime dependencies
- No runtime network access after the HTML has loaded

Random selection uses the browser's `crypto.getRandomValues()` API and rejection sampling to avoid modulo bias.

## Quick start

### Use the web demo

Just [open the demo](https://ttomohisa.github.io/htmlapps-random-picker/). No installation or account is required.

### Use the standalone HTML

1. Download `dist/index.html` from this repository or from a GitHub Actions build artifact.
2. Open the file in a current Chromium-based browser, Firefox, or Safari.
3. Start entering candidates immediately. A local web server is not required.

### Build it yourself

1. Download or clone this repository on Windows.
2. Double-click `build-standalone.bat`.
3. The generated files are written to `dist/`.
4. `dist/index.html` opens automatically after a successful build.

Python, Node.js, npm, and a local web server are not required. The build scripts use Windows PowerShell.

## Usage

1. Enter or paste one candidate per line.
2. Choose `Pick`, `Order`, `Teams`, or `Wheel`.
3. Adjust only the settings for the selected mode.
4. Run the action.
5. Copy, share, enlarge, or repeat the result as needed.

### Pick

Use this for drawings, lotteries, turn selection, or choosing one or more items.

- Choose how many candidates to pick at once.
- Enable removal to prevent picked candidates from appearing again in the same round.
- When all candidates have been picked, use **Restore all and pick again** to start a new round immediately.

### Order

Randomize the entire candidate list.

- Show the full randomized order at once, or
- use the large view to reveal one person at a time without exposing later positions early.

### Teams

Create teams whose sizes differ by at most one person.

Choose either:

- the number of teams, or
- the number of people per team.

The app shows the expected team layout before splitting.

### Wheel

Use the wheel when the selection process itself should be visible.

- Tap the wheel or the action button to spin.
- Open the large view before spinning to show the wheel prominently during the animation.
- The result remains visible after the wheel stops.

The wheel supports up to 200 candidates. For larger lists, use Pick mode.

### Saved lists

Save frequently used candidate sets with a name, such as a class list, team roster, lunch options, or presentation members.

Saved lists remain on the current browser/device and can be loaded again later. Up to 30 named lists are stored.

### Spreadsheet / Excel paste

When pasted data contains multiple tab-separated columns, Random Picker detects the table and lets you choose the column to use as candidates.

You can also paste the original data unchanged when that is what you want.

## Publish with GitHub Pages

The repository includes a workflow that builds and verifies the standalone HTML and then deploys `dist/` to GitHub Pages.

1. Push the repository to GitHub as `htmlapps-random-picker`.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Push to `main`, or manually run **Deploy standalone app to GitHub Pages** from the Actions tab.
4. After a successful deployment, the demo is available at `https://ttomohisa.github.io/htmlapps-random-picker/`.

Each push to `main` rebuilds and verifies the standalone HTML before deployment. Pull requests to `main` also run standalone build validation for relevant source and build-system changes.

## Development and build layout

```text
.
├─ src/
│  └─ index.template.html          # Application source template
├─ dist/
│  ├─ index.html                   # Readable standalone build
│  └─ index.self-extract.html      # Gzip self-extracting build
├─ scripts/
│  ├─ check-repository.ps1         # Repository/build verification
│  ├─ verify-standalone.ps1        # Standalone HTML verification
│  ├─ build-self-extract.ps1       # Self-extract build
│  └─ verify-self-extract.ps1      # Self-extract verification
├─ app.config.json                 # App metadata and build settings
├─ dependencies.json               # Runtime dependency definition
├─ build-standalone.bat            # Windows build entry point
├─ build-standalone.ps1            # Standalone HTML builder
└─ .github/workflows/
   ├─ build-standalone.yml         # Pull request build validation
   └─ deploy-pages.yml             # GitHub Pages deployment
```

Do not edit generated files in `dist/` directly. Update `src/index.template.html` and rebuild instead.

### Verify the repository

Run:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

The verification process builds the app, checks the standalone artifacts, verifies the self-extracting build, and reports generated file sizes.

## Privacy and local storage

Candidate data is processed locally in the browser.

The app uses browser storage for convenience features such as:

- the current candidate list
- selected mode and settings
- exclusion state
- recent draw history
- named saved lists

No account is required. Clearing browser/site data can remove locally saved lists and settings.

The GitHub Pages version requires the initial HTML request. After the page has loaded, the app does not require a runtime CDN, external library, or API connection.

## Limitations

- Up to 10,000 candidates are supported.
- Wheel mode supports up to 200 candidates.
- Duplicate candidate text is intentionally treated as separate entries unless duplicates are removed explicitly.
- Named lists are stored only in the current browser/device and are not synchronized between devices.
- Clearing browser storage can remove saved lists, settings, history, and the restored current list.
- Browser sharing depends on Web Share API support; copy remains available when sharing is unsupported.
- v1.0.0 does not include weighted picks, cloud accounts, CSV file import, or Google Sheets integration.

## Dependencies

Random Picker v1.0.0 has no third-party runtime dependencies. The application logic, wheel rendering, UI, storage, and randomization are implemented with browser-native APIs.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependency and notice information.

## Contributing

Bug reports and feature proposals are welcome through GitHub Issues. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance.

## License

Copyright © 2026 ttomohisa

Licensed under the [MIT License](LICENSE).
