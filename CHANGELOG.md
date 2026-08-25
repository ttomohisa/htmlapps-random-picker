# Changelog

## 1.0.1 - 2026-08-26

- Fixed mobile layouts so panels and mode controls fit the viewport without horizontal scrolling.
- Smoothly scrolls to the result after running Pick, Order, Teams, or Wheel on smartphones.
- Flipped the wheel pointer so it points left into the wheel.
- Added candidate-list sharing via JSON → gzip → Base64URL → URL fragment, with automatic import from shared links.
- Refined v1.0.1 mobile UX: fixed the help sheet bottom clipping, aligned the result auto-scroll to the result panel border, kept candidate status/actions on one row, and disabled candidate sharing for `file://` pages with an explanatory tooltip.
- Simplified the header meta label to “Pick · Order · Teams · Wheel” / “抽選・順番・チーム・ルーレット”.
- Stabilized the large mobile wheel so spinning no longer changes the horizontal layout width.
- Styled destructive clear actions in red and added confirmation dialogs for clearing candidates and draw history.
- Fixed the Sample button state after clearing candidates from Wheel mode.
- Changed Order copying to two result-area actions: numbered output or names-only output.
- Fixed an empty-wheel rendering exception after “Clear all” that left the Sample button disabled; wheel runs are also invalidated when the candidate list is reset.
- Removed the redundant runtime dependency count from the footer.

## 1.0.0 - 2026-08-21

- Added the initial Random Picker application on top of the single-HTML template foundation.
- Added secure one/multi-item picking with optional winner removal and a restore-and-redraw action when everyone has been selected.
- Added randomized order with list view and one-by-one presentation mode.
- Added balanced team generation by either number of teams or people per team, with live distribution preview.
- Added an animated Canvas wheel with large presentation mode.
- Added named candidate-list snapshots stored locally on the device.
- Added spreadsheet/Excel multi-column paste detection with column selection and paste-as-is fallback.
- Added mode-aware settings, result copy/share, draw history, and dedicated large-result layouts.
- Added reversible list cleanup and local persistence.
- Kept the application dependency-free and blocked runtime network access.
