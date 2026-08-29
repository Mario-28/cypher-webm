/* Cypher WEBM Studio - GM-broadcast fullscreen overlay player */
import { MODULE_ID } from "./module.js";

const SOCKET = `module.${MODULE_ID}`;
const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));

export class WebmPlayer {
  static #root = null;
  static #stopTimer = null;

  static register() {
    game.socket.on(SOCKET, (data) => WebmPlayer.#receive(data));
    WebmPlayer.#ensureRoot();
  }

  static get isPlaying() {
    return !!WebmPlayer.#root?.classList.contains("active");
  }

  static broadcastPlay(src) {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("CYPHER_WEBM.Warnings.GMOnly"));
      return;
    }
    if (!src) return;
    WebmPlayer.#emit({
      action: "play",
      src,
      loop: game.settings.get(MODULE_ID, "defaultLoop"),
      volume: game.settings.get(MODULE_ID, "defaultVolume"),
      fade: game.settings.get(MODULE_ID, "fadeMs")
    });
  }

  static broadcastStop() {
    if (!game.user.isGM) return;
    WebmPlayer.#emit({ action: "stop", fade: game.settings.get(MODULE_ID, "fadeMs") });
  }

  static broadcastPause() {
    if (!game.user.isGM) return;
    WebmPlayer.#emit({ action: "pause" });
  }

  static broadcastResume() {
    if (!game.user.isGM) return;
    WebmPlayer.#emit({ action: "resume" });
  }

  static broadcastVolume(volume) {
    if (!game.user.isGM) return;
    WebmPlayer.#emit({ action: "volume", volume: clamp01(volume) });
  }

  static #emit(payload) {
    payload.sender = game.user.id;
    game.socket.emit(SOCKET, payload);
    WebmPlayer.#receive(payload);
  }

  static #receive(data) {
    if (!data || typeof data !== "object") return;
    if (data.sender && data.sender !== game.user.id) {
      const sender = game.users.get(data.sender);
      if (!sender?.isGM) return;
    }
    switch (data.action) {
      case "play": WebmPlayer.#play(data); break;
      case "stop": WebmPlayer.#stop(data.fade ?? 300); break;
      case "pause": WebmPlayer.#video()?.pause(); break;
      case "resume": WebmPlayer.#video()?.play().catch(() => {}); break;
      case "volume": {
        const video = WebmPlayer.#video();
        if (video && data.volume !== undefined) video.volume = clamp01(data.volume);
        break;
      }
    }
  }

  static #video() {
    return WebmPlayer.#root?.querySelector("video.cypher-webm-video") ?? null;
  }

  static #ensureRoot() {
    if (WebmPlayer.#root?.isConnected) return WebmPlayer.#root;
    const root = document.createElement("div");
    root.className = "cypher-webm-overlay";
    root.innerHTML = `
      <video class="cypher-webm-video" playsinline></video>
      <button type="button" class="cypher-webm-unmute">
        <i class="fa-solid fa-volume-xmark"></i> ${game.i18n.localize("CYPHER_WEBM.Player.Unmute")}
      </button>
      <div class="cypher-webm-overlay-controls">
        <button type="button" data-player="pause" title="Pause"><i class="fa-solid fa-pause"></i></button>
        <button type="button" data-player="resume" title="Resume"><i class="fa-solid fa-play"></i></button>
        <button type="button" data-player="stop" title="Stop"><i class="fa-solid fa-stop"></i></button>
        <input type="range" min="0" max="1" step="0.05" data-player="volume" title="Volume">
      </div>`;

    root.querySelector(".cypher-webm-unmute").addEventListener("click", (event) => {
      const video = WebmPlayer.#video();
      if (!video) return;
      video.muted = false;
      video.play().catch(() => {});
      event.currentTarget.classList.add("cypher-webm-hidden");
    });

    const controls = root.querySelector(".cypher-webm-overlay-controls");
    if (!game.user.isGM) {
      controls.remove();
    } else {
      controls.querySelector('[data-player="pause"]').addEventListener("click", () => WebmPlayer.broadcastPause());
      controls.querySelector('[data-player="resume"]').addEventListener("click", () => WebmPlayer.broadcastResume());
      controls.querySelector('[data-player="stop"]').addEventListener("click", () => WebmPlayer.broadcastStop());
      const slider = controls.querySelector('[data-player="volume"]');
      slider.value = String(game.settings.get(MODULE_ID, "defaultVolume"));
      slider.addEventListener("input", () => WebmPlayer.broadcastVolume(Number(slider.value)));
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && WebmPlayer.isPlaying && game.user.isGM) {
        WebmPlayer.broadcastStop();
      }
    });

    document.body.appendChild(root);
    WebmPlayer.#root = root;
    return root;
  }

  static async #play({ src, loop, volume, fade }) {
    const root = WebmPlayer.#ensureRoot();
    const video = WebmPlayer.#video();
    clearTimeout(WebmPlayer.#stopTimer);
    root.style.setProperty("--cypher-webm-fade", `${Number(fade) || 0}ms`);
    video.loop = !!loop;
    video.volume = volume === undefined ? 0.5 : clamp01(volume);
    video.muted = true;
    root.querySelector(".cypher-webm-unmute")?.classList.remove("cypher-webm-hidden");
    if (video.dataset.currentSrc !== src) {
      video.src = src;
      video.dataset.currentSrc = src;
    }
    const slider = root.querySelector('[data-player="volume"]');
    if (slider) slider.value = String(video.volume);
    root.classList.add("active");
    try {
      await video.play();
    } catch (err) {
      /* Browser blocked autoplay; the Unmute button doubles as the play gesture. */
    }
  }

  static #stop(fade) {
    const root = WebmPlayer.#root;
    if (!root) return;
    const ms = Number(fade) || 0;
    root.style.setProperty("--cypher-webm-fade", `${ms}ms`);
    root.classList.remove("active");
    clearTimeout(WebmPlayer.#stopTimer);
    WebmPlayer.#stopTimer = setTimeout(() => {
      const video = WebmPlayer.#video();
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.dataset.currentSrc = "";
      video.load();
    }, ms);
  }
}
