# Random Picker

A local-only single-HTML tool for quickly picking winners, randomizing order, making balanced teams, or spinning a wheel from a one-item-per-line list.

## Features

- Pick one or multiple candidates
- Optionally remove winners from later draws
- Randomize the complete order
- Split candidates by number of teams or people per team, with balanced sizes
- Canvas wheel mode
- Draw history, mode-aware copy, share, and full-screen presentation
- Reveal randomized order one person at a time in presentation mode
- Save multiple named candidate lists locally
- Detect spreadsheet/Excel multi-column paste and choose a candidate column
- Duplicate labels stay as separate candidates unless explicitly cleaned
- Trim whitespace, remove blank lines, and remove duplicates
- Automatically save the current list and settings locally
- Japanese / English UI
- No third-party runtime dependency and no runtime network access

Random selection uses the browser's `crypto.getRandomValues()` API with rejection sampling to avoid modulo bias.

## Usage

1. Enter or paste one candidate per line.
2. Choose Pick, Order, Teams, or Wheel.
3. Adjust the settings shown for the selected mode when needed.
4. Run the action.
5. Copy, share, present, or repeat the result.

## Privacy

Candidates, settings, and randomization stay inside the browser. This app does not upload the list to a server. The current list and settings are stored in `localStorage` only when browser storage is available.

## Supported browsers / devices

Current stable desktop and mobile Chromium, Firefox, and Safari. `dist/index.html` is designed to open directly through `file://`.

## Limitations

- Up to 10,000 candidates.
- Wheel view supports up to 200 candidates; use Pick mode for larger lists.
- v1.0.0 does not include weighted picks, cloud accounts, CSV file import, or Google Sheets integration.
- Clearing browser site data can remove locally saved candidates and settings.

## Single HTML / offline behavior

Release artifacts:

- `dist/index.html` — readable self-contained build
- `dist/index.self-extract.html` — gzip self-extracting build

Neither build requires a runtime CDN or API connection.

## Development / build

On Windows:

```bat
build-standalone.bat
```

Verification:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

Do not edit generated files in `dist/` by hand. Edit `src/index.template.html` and rebuild.

## License

See `LICENSE`. v1.0.0 has no third-party runtime dependency.
