/* Cypher WEBM Studio - entry point: settings, socket, scene control button */
import { MODULE_ID } from "./constants.js";
import { WebmManager } from "./webm-manager.js";
import { WebmPlayer } from "./webm-player.js";
import { patchNativeFilePicker } from "./native-picker.js";
import * as WebmActions from "./webm-actions.js";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "libraryPath", {
    name: "CYPHER_WEBM.Settings.LibraryPath.Name",
    hint: "CYPHER_WEBM.Settings.LibraryPath.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "assets/cypher-webm"
  });

  game.settings.register(MODULE_ID, "allowPlayerManager", {
    name: "CYPHER_WEBM.Settings.AllowPlayerManager.Name",
    hint: "CYPHER_WEBM.Settings.AllowPlayerManager.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "nativePickerWebm", {
    name: "CYPHER_WEBM.Settings.NativePickerWebm.Name",
    hint: "CYPHER_WEBM.Settings.NativePickerWebm.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, "defaultLoop", {
    name: "CYPHER_WEBM.Settings.DefaultLoop.Name",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "defaultVolume", {
    name: "CYPHER_WEBM.Settings.DefaultVolume.Name",
    scope: "world",
    config: true,
    type: Number,
    default: 0.5,
    range: { min: 0, max: 1, step: 0.05 }
  });

  game.settings.register(MODULE_ID, "fadeMs", {
    name: "CYPHER_WEBM.Settings.FadeMs.Name",
    hint: "CYPHER_WEBM.Settings.FadeMs.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 300,
    range: { min: 0, max: 2000, step: 50 }
  });

  game.settings.registerMenu(MODULE_ID, "openStudio", {
    name: "CYPHER_WEBM.Settings.OpenStudio.Name",
    label: "CYPHER_WEBM.Settings.OpenStudio.Label",
    hint: "CYPHER_WEBM.Settings.OpenStudio.Hint",
    icon: "fa-solid fa-video",
    type: WebmManager,
    restricted: true
  });
});

Hooks.once("setup", () => {
  if (game.settings.get(MODULE_ID, "nativePickerWebm")) {
    patchNativeFilePicker();
  }
});

Hooks.once("ready", async () => {
  WebmPlayer.register();

  game.modules.get(MODULE_ID).api = {
    manager: WebmManager,
    player: WebmPlayer,
    actions: WebmActions
  };

  if (game.user.isGM && game.user.can("FILES_UPLOAD")) {
    try {
      await foundry.applications.apps.FilePicker.createDirectory("data", WebmManager.libraryPath);
    } catch (err) {
      /* Folder already exists or cannot be created; browsing handles both. */
    }
  }
});

Hooks.on("getSceneControlButtons", (controls) => {
  const canOpen = game.user.isGM || game.settings.get(MODULE_ID, "allowPlayerManager");
  controls[MODULE_ID] = {
    name: MODULE_ID,
    order: 900,
    title: "CYPHER_WEBM.Controls.Group.Title",
    icon: "fa-solid fa-video",
    visible: canOpen,
    activeTool: "openStudio",
    tools: {
      openStudio: {
        name: "openStudio",
        order: 1,
        title: "CYPHER_WEBM.Controls.OpenStudio.Title",
        icon: "fa-solid fa-photo-film",
        button: true,
        visible: true,
        onChange: () => WebmManager.open()
      }
    }
  };
});
