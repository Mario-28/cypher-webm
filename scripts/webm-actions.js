/* Cypher WEBM Studio - canvas and scene helpers */
export function probeVideoSize(src, fallback = { width: 640, height: 360 }) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = src;
    const finish = (size) => {
      video.removeAttribute("src");
      video.load();
      resolve(size);
    };
    video.addEventListener("loadedmetadata", () => {
      finish(video.videoWidth && video.videoHeight
        ? { width: video.videoWidth, height: video.videoHeight }
        : fallback);
    }, { once: true });
    video.addEventListener("error", () => finish(fallback), { once: true });
  });
}

export async function createVideoTile(src) {
  if (!canvas?.ready || !canvas.scene) {
    ui.notifications.warn(game.i18n.localize("CYPHER_WEBM.Warnings.NoCanvas"));
    return null;
  }
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("CYPHER_WEBM.Warnings.GMOnly"));
    return null;
  }
  const { width, height } = await probeVideoSize(src);
  const scale = Math.min(1, 800 / width);
  const w = Math.max(100, Math.round(width * scale));
  const h = Math.max(100, Math.round(height * scale));
  const center = canvas.center;
  const [tile] = await canvas.scene.createEmbeddedDocuments("Tile", [{
    texture: { src },
    width: w,
    height: h,
    x: Math.round(center.x - w / 2),
    y: Math.round(center.y - h / 2),
    locked: false
  }]);
  canvas.tiles.activate();
  ui.notifications.info(game.i18n.localize("CYPHER_WEBM.Info.TileCreated"));
  return tile;
}

export async function setSceneBackground(src) {
  if (!canvas?.scene) {
    ui.notifications.warn(game.i18n.localize("CYPHER_WEBM.Warnings.NoCanvas"));
    return false;
  }
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("CYPHER_WEBM.Warnings.GMOnly"));
    return false;
  }
  await canvas.scene.update({ "background.src": src });
  ui.notifications.info(game.i18n.localize("CYPHER_WEBM.Info.BackgroundSet"));
  return true;
}

export async function setSceneForeground(src) {
  if (!canvas?.scene) {
    ui.notifications.warn(game.i18n.localize("CYPHER_WEBM.Warnings.NoCanvas"));
    return false;
  }
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("CYPHER_WEBM.Warnings.GMOnly"));
    return false;
  }
  await canvas.scene.update({ foreground: src });
  ui.notifications.info(game.i18n.localize("CYPHER_WEBM.Info.ForegroundSet"));
  return true;
}
