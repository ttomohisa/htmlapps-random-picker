# Security Policy

## Supported version

Security fixes target the latest version on the default branch.

## Reporting a vulnerability

Do not publish sensitive vulnerability details in a public issue. Use the repository owner's private security reporting channel when available.

Include the affected commit/version, reproduction steps, expected/actual behavior, and security impact.

## Trust model

Random Picker is a static browser application with no backend.

- Runtime network connections are blocked with `connect-src 'none'`.
- Candidate lists and results are processed only in browser memory and local storage.
- There is no analytics, telemetry, remote font, account system, or silent update check.
- v1.0.0 has no third-party runtime dependency.
- Copy and Share happen only after explicit user action.

A downloaded HTML file is executable code. Distribute it through a trusted channel and verify hashes for high-trust workflows.

## Local storage

The current list, mode, settings, excluded-row state, and recent draw history may be saved to `localStorage`. Browser site-data clearing, private browsing behavior, or storage quotas may remove this data.

Do not use local persistence as the only record for an important public drawing. Copy or otherwise record results when auditability matters.

## Randomness boundary

The picker uses browser-provided `crypto.getRandomValues()` and rejection sampling to select rows uniformly. This provides strong local randomness, but the application is not a publicly verifiable randomness beacon and does not create externally witnessed audit proofs.
