# Offline Verification

1. Run `build-standalone.bat` on Windows.
2. Open `dist/index.html` and `dist/index.self-extract.html` directly.
3. Open browser developer tools and clear the Network panel.
4. Enable offline mode or disconnect the device.
5. Reload the local HTML.
6. Paste a candidate list and test Pick, Order, Teams, and Wheel.
7. Turn on winner removal, draw repeatedly, restore removed candidates, and verify the remaining count.
8. Test result copy, full-screen presentation, history clearing + Undo, candidate cleanup + Undo, and language switching.
9. Reload and confirm the current candidate list/settings are restored when local storage is available.
10. Confirm there is no failed external resource request and no console error.

For GitHub Pages, one initial request downloads the HTML. Clear the Network panel after the page has loaded, then test the complete app flow.

## Self-extracting variant

Open `dist/index.self-extract.html` directly, confirm that the loading screen is readable, the favicon matches `dist/index.html`, and the application replaces the loader successfully. Repeat the same offline checks and verify that the browser console contains no decompression or CSP errors.
