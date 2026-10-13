export const GRAPHICS_STORAGE_KEY = 'andys-world-graphics-v1';

type GraphicsStorage = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): GraphicsStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadLowGraphics(storage: GraphicsStorage | null = browserStorage()) {
  try {
    return storage?.getItem(GRAPHICS_STORAGE_KEY) === 'low';
  } catch {
    return false;
  }
}

export function saveLowGraphics(enabled: boolean, storage: GraphicsStorage | null = browserStorage()) {
  try {
    storage?.setItem(GRAPHICS_STORAGE_KEY, enabled ? 'low' : 'standard');
  } catch {
    // The current session can still use the selected mode without persistence.
  }
}

export function graphicsPixelRatio(enabled: boolean, pixelRatio: number, coarsePointer: boolean) {
  const ratio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
  return Math.min(ratio, enabled ? .75 : coarsePointer ? 1 : 1.5);
}

