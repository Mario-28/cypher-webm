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

export function patchNativeFilePicker() {
  const FilePicker = foundry.applications?.apps?.FilePicker;
  if (!FilePicker?.prototype) {
    console.warn(`${MODULE_ID} | FilePicker class not found; native picker patch skipped.`);
    return false;
  }

  const patched = [];

  /* Layer 1: instance-level. The picker feeds its own `extensions` getter into
     browse/matchFiles, so appending webm there lists and accepts the files. */
  let proto = FilePicker.prototype;
  let descriptor;
  while (proto && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(proto, "extensions");
    proto = Object.getPrototypeOf(proto);
  }
  if (descriptor?.get) {
    const originalGet = descriptor.get;
    Object.defineProperty(FilePicker.prototype, "extensions", {
      configurable: true,
      get() {
        const extensions = originalGet.call(this);
        if (!Array.isArray(extensions)) return extensions;
        const type = this.options?.type ?? this.type;
        if (IMAGE_LIKE_TYPES.includes(type)) return withWebm(extensions);
        return extensions;
      }
    });
    patched.push("extensions-getter");
  }

  /* Layer 2: request-level safety net. Any image-scoped browse that built its
     extension list without the getter still gets webm appended. */
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
