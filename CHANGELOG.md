# Changelog

## 1.1.2 — 2026-08-29

- Fix: the native picker patch did not affect V14 pickers. In V14, FilePicker `extensions` is an instance property (not a prototype getter), and the filtered file list is built inside `_prepareContext`. The patch now wraps `_prepareContext`: it appends webm to the accepted extension list and merges matching .webm files into the displayed results (deduplicated by path). The `FilePicker.browse` wrapper is kept as a second layer.

## 1.1.1 — 2026-08-29

- Hardened the native picker patch: the `extensions` getter is now located by walking the prototype chain (covers inherited definitions), and `FilePicker.browse` is wrapped as a request-level fallback that appends webm to any image-scoped extension list.
- Clearer console diagnostics: the module logs exactly which patch layers were applied, and warns if the FilePicker API shape was not found.

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
