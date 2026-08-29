# Cypher WEBM Studio

Upload, organize and play **WEBM** videos in **Foundry VTT 14+** — built for Cypher System worlds, but works in any world.

## Features

- **WEBM library manager** (ApplicationV2) with live hover previews, breadcrumbs, subfolders and drag & drop upload.
- **One-click canvas use**: create a video tile, set a video as scene background or foreground.
- **Broadcast player**: the GM can play any WEBM fullscreen to every connected player, with pause / resume / stop / loop / volume synced over sockets. Clients start muted (browser autoplay policy) and get an Unmute button.
- **Configurable**: library path, default loop, default volume, overlay fade, optional read-only access for players.

## Installation

1. In Foundry VTT, open **Add-on Modules** → **Install Module**.
2. Paste the manifest URL:
   `https://raw.githubusercontent.com/Mario-28/cypher-webm/main/module.json`
3. Enable **Cypher WEBM Studio** in your world.

## Usage

- Open the studio from the **video-camera scene control** (left toolbar) or via **Module Settings → WEBM Studio**.
- Upload with the **Upload WEBM** button or by dropping `.webm` files onto the window. Files land in your library folder (default `assets/cypher-webm/`).
- Each video card offers: **create tile**, **set background**, **set foreground**, **play to all players**, and **copy path**.

## Permissions

- Uploading requires the core **Upload New File** permission (players typically don't have it — the studio hides upload controls then).
- Playback broadcast is GM-only. Players can browse read-only if the GM enables it in settings.

## Compatibility

- Foundry VTT: minimum **14**, verified **14**.
- System-agnostic; developed for the Cypher System.

## License

MIT — see LICENSE.
