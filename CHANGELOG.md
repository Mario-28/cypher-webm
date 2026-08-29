# Changelog

## 1.1.0 — 2026-08-29

- New option "WEBM In Native File Pickers" (world setting, default on, requires reload): patches the FilePicker `extensions` getter so image-type pickers (actor portraits, item art, journal images, etc.) list and accept `.webm` files. Tile and scene pickers already accepted video; this covers the rest.

## 1.0.1 — 2026-08-29

- Fix: module failed to load entirely (no settings, no scene button) due to a circular import of MODULE_ID between module.js and its submodules. MODULE_ID now lives in scripts/constants.js with no imports, breaking the cycle.
- Removed an unused import from webm-actions.js.

## 1.0.0 — 2026-08-29

- Initial release.
- WEBM library manager (ApplicationV2): browse, breadcrumbs, subfolders, hover previews.
- Upload via button and drag & drop into a configurable library folder.
- Canvas actions: create video tile, set scene background, set scene foreground.
- GM broadcast overlay player with socket-synced play / pause / resume / stop / volume and mute-safe autoplay.
- English localization; world-scoped settings; read-only player access option.
