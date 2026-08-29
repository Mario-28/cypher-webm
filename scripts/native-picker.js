/* Cypher WEBM Studio - make native FilePicker instances see and accept WEBM */
import { MODULE_ID } from "./constants.js";

const IMAGE_LIKE_TYPES = ["image", "imagevideo", "graphics"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "avif", "svg", "bmp", "tiff"];

function normalizeExtension(ext) {
  return String(ext).replace(/^\./, "").toLowerCase();
}

function looksImageScoped(extensions) {
  return extensions.some((e) => IMAGE_EXTENSIONS.includes(normalizeExtension(e)));
}

function withWebm(extensions) {
  const has = extensions.some((e) => normalizeExtension(e) === "webm");
  return has ? extensions : [...extensions, "webm"];
}

function fileKey(entry) {
  if (typeof entry === "string") return entry;
  return entry?.path ?? entry?.src ?? entry?.url ?? null;
}

export function patchNativeFilePicker() {
  const FilePicker = foundry.applications?.apps?.FilePicker;
  if (!FilePicker?.prototype) {
    console.warn(`${MODULE_ID} | FilePicker class not found; native picker patch skipped.`);
    return false;
  }

  const patched = [];

  /* Layer 1 (primary): wrap _prepareContext. In V14, `extensions` is an instance
     property (not a prototype getter), and the displayed file list is already
     filtered when the render context is built. After the original runs we append
     webm to the accepted extensions and merge matching .webm files from our own
     browse into the displayed list, deduplicated by path. */
  const originalPrepare = FilePicker.prototype._prepareContext;
  if (typeof originalPrepare === "function") {
    FilePicker.prototype._prepareContext = async function (options) {
      const context = await originalPrepare.call(this, options);
      try {
        const type = this.options?.type ?? this.type;
        if (!IMAGE_LIKE_TYPES.includes(type)) return context;
        if (Array.isArray(context?.extensions)) {
          context.extensions = withWebm(context.extensions);
        }
        if (!Array.isArray(context?.files)) return context;
        const source = this.activeSource ?? "data";
        const target = context.target ?? this.target ?? "";
        const extra = await FilePicker.browse(source, target, { extensions: ["webm"] });
        const existing = new Set(context.files.map(fileKey));
        for (const file of extra?.files ?? []) {
          const key = fileKey(file);
          if (key && !existing.has(key)) {
            context.files.push(file);
            existing.add(key);
          }
        }
      } catch (err) {
        console.warn(`${MODULE_ID} | WEBM merge into FilePicker failed`, err);
      }
      return context;
    };
    patched.push("prepare-context");
  }

  /* Layer 2 (request-level): any image-scoped browse gets webm appended, so the
     server itself returns WEBM files when the caller passes image extensions. */
  const originalBrowse = FilePicker.browse;
  if (typeof originalBrowse === "function") {
    FilePicker.browse = function patchedBrowse(source, target, options = {}) {
      if (Array.isArray(options?.extensions) && looksImageScoped(options.extensions)) {
        options = { ...options, extensions: withWebm(options.extensions) };
      }
      return originalBrowse.call(this, source, target, options);
    };
    patched.push("browse");
  }

  if (!patched.length) {
    console.warn(`${MODULE_ID} | Could not patch FilePicker (API shape changed?); native WEBM support unavailable.`);
    return false;
  }
  console.log(`${MODULE_ID} | Native FilePicker patched [${patched.join(", ")}]: WEBM visible in image-type pickers.`);
  return true;
}
