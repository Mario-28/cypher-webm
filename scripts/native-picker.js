/* Cypher WEBM Studio - make native FilePicker instances see and accept WEBM */
import { MODULE_ID } from "./constants.js";

const IMAGE_LIKE_TYPES = ["image", "imagevideo", "graphics"];

export function patchNativeFilePicker() {
  const FilePicker = foundry.applications?.apps?.FilePicker;
  if (!FilePicker?.prototype) {
    console.warn(`${MODULE_ID} | FilePicker class not found; native picker patch skipped.`);
    return false;
  }

  const descriptor = Object.getOwnPropertyDescriptor(FilePicker.prototype, "extensions");
  if (!descriptor?.get) {
    console.warn(`${MODULE_ID} | FilePicker#extensions getter not found; native picker patch skipped.`);
    return false;
  }

  const originalGet = descriptor.get;
  Object.defineProperty(FilePicker.prototype, "extensions", {
    configurable: true,
    get() {
      const extensions = originalGet.call(this);
      if (!Array.isArray(extensions)) return extensions;
      const type = this.options?.type ?? this.type;
      if (IMAGE_LIKE_TYPES.includes(type) && !extensions.includes("webm")) {
        return [...extensions, "webm"];
      }
      return extensions;
    }
  });

  console.log(`${MODULE_ID} | Native FilePicker patched: WEBM now visible in image-type pickers.`);
  return true;
}
