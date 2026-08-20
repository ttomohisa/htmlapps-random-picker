# Random Picker — APP_SPEC.md

## 1. Product identity

- **Name:** Random Picker / ランダムピッカー
- **Purpose:** Pick one or more items, randomize an entire order, split people into balanced teams, or choose one item with a wheel animation.
- **Primary users:** People who need a quick draw for classes, meetings, events, games, meals, chores, or small giveaways.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. Problem and outcome

Many random picker sites prioritize a large roulette UI or require users to send their list to a server. Random Picker prioritizes the fastest common flow: paste one item per line and immediately draw.

The application is fully local. Names and candidate lists can contain class, staff, family, or event information without being uploaded by this app.

## 3. Core user flow

1. Open the HTML locally or on GitHub Pages.
2. Enter or paste one candidate per line.
3. Choose Pick, Order, Teams, or Wheel.
4. Adjust the settings shown for the selected mode when relevant.
5. Run the action.
6. Copy, share, present, repeat, or inspect draw history.
7. Reload later and recover the last candidate list and settings from local storage, or load a named saved list.

## 4. Functional requirements

### Candidate input

- Accept plain text with one item per line.
- Detect tab-separated spreadsheet paste, let the user choose a column, and preserve a paste-as-is path.
- Ignore blank lines when drawing.
- Trim leading/trailing whitespace when interpreting a candidate.
- Preserve duplicate labels as separate candidates by default.
- Show candidate count, remaining count, blank-line status, and duplicate status.
- Support up to 10,000 non-empty candidates and 500,000 source characters.
- Provide reversible cleanup actions for whitespace, blank lines, duplicates, sample loading, and clearing.
- Editing the candidate source resets excluded candidates, result state, and draw history.

### Pick mode

- Pick 1–1,000 unique rows in a single draw, limited by the remaining pool.
- Use `crypto.getRandomValues()` with rejection sampling to avoid modulo bias.
- When “remove selected items” is on, selected rows are excluded from later draws.
- Allow all excluded rows to be restored, with Undo.
- When every candidate has been selected, offer a prominent “restore all and pick again” action.
- Keep duplicate labels distinct when they came from separate rows.

### Order mode

- Securely shuffle all currently available candidates.
- Show the complete numbered order in a scrollable result.
- In large presentation mode, optionally reveal the randomized order one item at a time without exposing later positions.

### Teams mode

- Support splitting by either a 2–50 team count or a requested people-per-team size, limited by available candidate count.
- Securely shuffle candidates first.
- Calculate a balanced number of teams and distribute round-robin so team sizes differ by at most one.
- Preview the expected team count and size range before running.

### Wheel mode

- Support up to 200 total candidates.
- Select the winning candidate before animation using the same secure random routine as Pick mode.
- Animate a Canvas wheel to the selected segment.
- Respect `prefers-reduced-motion` and complete nearly immediately when reduced motion is requested.
- Wheel mode never changes the Pick-mode excluded-candidate pool.

### Result actions

- Copy current result with mode-specific labels and formatting via Clipboard API and a compatibility fallback.
- Use native Share when available; otherwise copy the result.
- Provide a full-screen presentation dialog.
- Provide an Again action.
- Record Pick and Wheel results in a maximum 50-entry session history.
- Provide reversible history clearing.

### Persistence

- Store the current source list, mode-specific settings, remove-selected setting, exclusion state, and recent history in local storage when available.
- Store up to 30 named candidate-list snapshots separately in local storage when available.
- Store language separately.
- The application must still work if local storage is unavailable.

### Language and appearance

- Japanese and English in one HTML.
- Auto-select Japanese when browser language starts with `ja`, otherwise English, unless the user previously selected a language.
- Light-only UI.
- No dark-mode switch.

## 5. Data and privacy

- No runtime network requests.
- No analytics, telemetry, account, or server storage.
- Candidate data and results stay in browser memory/local storage.
- Sharing or copying occurs only after explicit user action.

## 6. Non-goals for v1.0.0

- Weighted probability.
- Cloud-saved lists or accounts; named lists are device-local only.
- Google Sheets / CSV file import. Spreadsheet clipboard paste is supported.
- Images inside wheel segments.
- Sound packs, custom themes, or remote assets.
- Verifiable public audit logs or externally witnessed randomness.

## 7. UX and accessibility

- Mobile-first from 320px upward.
- At smartphone widths, keep the primary Run button reachable near the mode-specific settings and result immediately below the input workflow.
- Desktop uses a two-column input/result layout; result stays visible while editing.
- All controls have labels or accessible names.
- Keyboard focus is visible.
- `Ctrl+Enter` / `Cmd+Enter` runs the current mode when valid.
- Use Toast + Undo for reversible destructive changes.
- Help opens from the upper-right `?` button and is bilingual.
- Motion respects `prefers-reduced-motion`.
- No generic emoji as core interface icons.

## 8. Performance expectations

- No third-party runtime dependencies.
- Typical lists should update immediately.
- 10,000-candidate Pick/Order/Teams operations should remain practical on current phones and desktops.
- Wheel drawing is capped at 200 candidates to keep animation readable and responsive.

## 9. Browser target

Current stable desktop and mobile Chromium, Firefox, and Safari. Direct `file://` opening is required.

## 10. Acceptance criteria

- `build-standalone.ps1` produces both release HTML variants.
- Generated files contain no unresolved build placeholders or external runtime resources.
- CSP includes `connect-src 'none'`.
- Empty input disables execution.
- Duplicate labels remain separate unless the user explicitly removes duplicates.
- Pick mode never selects the same candidate row twice in one multi-pick.
- Remove-selected mode reduces the remaining pool and restore returns it.
- Order contains every available row exactly once.
- Team sizes differ by at most one.
- Wheel winner matches the segment targeted by the animation.
- Current list/settings and named list snapshots survive reload when local storage is available.
- Spreadsheet column selection never overwrites existing input until the user chooses how to paste.
- Order presentation can advance and go back one item at a time.
- Team split-by-size never creates a team larger than the requested size when within the supported team-count limit.
- Japanese and English fit at 360px width.
- Help accurately describes privacy, storage, editing reset behavior, and wheel limits.
