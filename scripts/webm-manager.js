/* Cypher WEBM Studio - library manager window (ApplicationV2) */
import { MODULE_ID } from "./module.js";
import { WebmPlayer } from "./webm-player.js";
import { createVideoTile, setSceneBackground, setSceneForeground } from "./webm-actions.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class WebmManager extends HandlebarsApplicationMixin(ApplicationV2) {
  static #instance;

  constructor(options = {}) {
    super(options);
    this.path = options.path ?? WebmManager.libraryPath;
    this.readOnly = !game.user.isGM;
  }

  static DEFAULT_OPTIONS = {
    id: "cypher-webm-manager",
    tag: "section",
    classes: ["cypher-webm", "cypher-webm-manager"],
    window: {
      title: "CYPHER_WEBM.Manager.Title",
      icon: "fa-solid fa-video",
      resizable: true
    },
    position: { width: 780, height: 620 },
    actions: {
      upload: WebmManager.#onUpload,
      refresh: WebmManager.#onRefresh,
      createFolder: WebmManager.#onCreateFolder,
      navigate: WebmManager.#onNavigate,
      goUp: WebmManager.#onGoUp,
      createTile: WebmManager.#onCreateTile,
      setBackground: WebmManager.#onSetBackground,
      setForeground: WebmManager.#onSetForeground,
      playVideo: WebmManager.#onPlayVideo,
      copyPath: WebmManager.#onCopyPath
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/manager.hbs`,
      scrollable: [".cypher-webm-grid"]
    }
  };

  static get libraryPath() {
    const path = game.settings.get(MODULE_ID, "libraryPath") || "assets/cypher-webm";
    return path.replace(/^\/+|\/+$/g, "");
  }

  static open() {
    const canOpen = game.user.isGM || game.settings.get(MODULE_ID, "allowPlayerManager");
    if (!canOpen) {
      ui.notifications.warn(game.i18n.localize("CYPHER_WEBM.Warnings.GMOnly"));
      return null;
    }
    WebmManager.#instance ??= new WebmManager();
    WebmManager.#instance.render({ force: true });
    return WebmManager.#instance;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const FilePicker = foundry.applications.apps.FilePicker;

    let dirs = [];
    let files = [];
    let browseError = false;
    try {
      const result = await FilePicker.browse("data", this.path, { extensions: [".webm"] });
      dirs = result.dirs ?? [];
      files = (result.files ?? []).filter((f) => /\.webm$/i.test(f));
    } catch (err) {
      browseError = true;
    }

    const segments = this.path.split("/").filter(Boolean);
    const breadcrumbs = segments.map((name, i) => ({
      name,
      path: segments.slice(0, i + 1).join("/")
    }));
    const parent = segments.length > 1 ? segments.slice(0, -1).join("/") : null;
    const canUse = !this.readOnly;

    return foundry.utils.mergeObject(context, {
      path: this.path,
      breadcrumbs,
      parent,
      browseError,
      readOnly: this.readOnly,
      canUpload: canUse && game.user.can("FILES_UPLOAD"),
      dirs: dirs.map((d) => ({ name: decodeURIComponent(d.split("/").pop()), path: d })),
      files: files.map((f) => ({
        name: decodeURIComponent(f.split("/").pop()),
        src: f,
        canUse
      }))
    });
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;

    const input = root.querySelector("input.cypher-webm-file-input");
    input?.addEventListener("change", (event) => {
      this.#uploadFiles(event.target.files);
      event.target.value = "";
    });

    root.addEventListener("dragover", (event) => {
      event.preventDefault();
      root.classList.add("cypher-webm-dragover");
    });
    root.addEventListener("dragleave", (event) => {
      if (event.target === root) root.classList.remove("cypher-webm-dragover");
    });
    root.addEventListener("drop", (event) => {
      event.preventDefault();
      root.classList.remove("cypher-webm-dragover");
      this.#uploadFiles(event.dataTransfer?.files);
    });

    for (const video of root.querySelectorAll("video[data-hover]")) {
      video.addEventListener("mouseenter", () => video.play().catch(() => {}));
      video.addEventListener("mouseleave", () => video.pause());
    }
  }

  async #uploadFiles(fileList) {
    if (this.readOnly || !fileList?.length) return;
    if (!game.user.can("FILES_UPLOAD")) {
      ui.notifications.warn(game.i18n.localize("CYPHER_WEBM.Warnings.NoUploadPermission"));
      return;
    }
    const FilePicker = foundry.applications.apps.FilePicker;
    let uploaded = 0;
    let skipped = 0;
    for (const file of fileList) {
      if (!/\.webm$/i.test(file.name)) {
        skipped++;
        continue;
      }
      try {
        const response = await FilePicker.upload("data", this.path, file, {}, { notify: false });
        if (response) uploaded++;
      } catch (err) {
        console.error(`${MODULE_ID} | Upload failed for ${file.name}`, err);
      }
    }
    if (uploaded) ui.notifications.info(game.i18n.format("CYPHER_WEBM.Info.Uploaded", { count: uploaded }));
    if (skipped) ui.notifications.warn(game.i18n.format("CYPHER_WEBM.Warnings.Skipped", { count: skipped }));
    this.render();
  }

  static #onUpload(event, target) {
    this.element.querySelector("input.cypher-webm-file-input")?.click();
  }

  static #onRefresh(event, target) {
    this.render();
  }

  static #onNavigate(event, target) {
    const path = target.dataset.path;
    if (!path || path === this.path) return;
    this.path = path;
    this.render();
  }

  static #onGoUp(event, target) {
    const segments = this.path.split("/").filter(Boolean);
    if (segments.length <= 1) return;
    this.path = segments.slice(0, -1).join("/");
    this.render();
  }

  static async #onCreateFolder(event, target) {
    const name = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize("CYPHER_WEBM.Manager.NewFolder") },
      content: `<div class="form-group"><input type="text" name="folder" autofocus placeholder="${game.i18n.localize("CYPHER_WEBM.Manager.FolderPlaceholder")}"></div>`,
      ok: {
        label: game.i18n.localize("CYPHER_WEBM.Manager.Create"),
        icon: "fa-solid fa-folder-plus",
        callback: (event2, button) => button.form.elements.folder.value.trim()
      },
      rejectClose: false
    });
    const safe = (name ?? "").replace(/[\\/:*?"<>|]/g, "").trim();
    if (!safe) return;
    try {
      await foundry.applications.apps.FilePicker.createDirectory("data", `${this.path}/${safe}`);
      this.render();
    } catch (err) {
      ui.notifications.error(game.i18n.localize("CYPHER_WEBM.Warnings.FolderFailed"));
      console.error(`${MODULE_ID} | createDirectory failed`, err);
    }
  }

  static #onCreateTile(event, target) {
    createVideoTile(target.dataset.src);
  }

  static #onSetBackground(event, target) {
    if (this.readOnly) return;
    setSceneBackground(target.dataset.src);
  }

  static #onSetForeground(event, target) {
    if (this.readOnly) return;
    setSceneForeground(target.dataset.src);
  }

  static #onPlayVideo(event, target) {
    if (this.readOnly) return;
    WebmPlayer.broadcastPlay(target.dataset.src);
  }

  static #onCopyPath(event, target) {
    game.clipboard.copyPlainText(target.dataset.src);
    ui.notifications.info(game.i18n.localize("CYPHER_WEBM.Info.PathCopied"));
  }
}
