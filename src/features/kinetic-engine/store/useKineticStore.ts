import { create } from "zustand";
import type { Font } from "opentype.js";
import { clearKineticFontCache, loadKineticFont } from "../core/font-loader";
import { getEffect, listEffects } from "../effects/registry";

const effects = listEffects();
const DEFAULT_FONT_ID = "space-grotesk";

export interface KineticStoreState {
  text: string;
  fontId: string;
  font: Font | null;
  loadedFontId: string | null;
  isFontLoading: boolean;
  isFontFailed: boolean;
  effectId: string;
  params: Record<string, unknown>;

  // Actions
  setText: (text: string) => void;
  setFontId: (fontId: string) => void;
  selectEffect: (effectId: string) => void;
  setParams: (params: Record<string, unknown>) => void;
  loadFont: (targetFontId?: string) => Promise<void>;
  retryFontLoad: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  text: "Wave",
  fontId: DEFAULT_FONT_ID,
  font: null as Font | null,
  loadedFontId: null as string | null,
  isFontLoading: false,
  isFontFailed: false,
  effectId: effects[0]?.id ?? "",
  params: effects[0]?.defaultParams ?? {},
};

export const useKineticStore = create<KineticStoreState>((set, get) => ({
  ...initialState,

  setText: (text: string) => set({ text }),

  setFontId: (fontId: string) => {
    if (get().fontId === fontId) return;
    set({ fontId, isFontFailed: false });
  },

  selectEffect: (effectId: string) => {
    const effect = getEffect(effectId);
    set({
      effectId,
      params: effect ? { ...effect.defaultParams } : {},
    });
  },

  setParams: (params: Record<string, unknown>) => set({ params }),

  loadFont: async (targetFontId?: string) => {
    const id = targetFontId ?? get().fontId;
    if (get().loadedFontId === id && get().font) {
      set({ isFontLoading: false, isFontFailed: false });
      return;
    }

    set({ isFontLoading: true, isFontFailed: false });
    try {
      const loaded = await loadKineticFont(id);
      if (get().fontId === id) {
        set({
          font: loaded,
          loadedFontId: id,
          isFontLoading: false,
          isFontFailed: false,
        });
      }
    } catch {
      if (get().fontId === id) {
        set({
          isFontLoading: false,
          isFontFailed: true,
        });
      }
    }
  },

  retryFontLoad: async () => {
    const { fontId } = get();
    clearKineticFontCache(fontId);
    set({ isFontFailed: false, isFontLoading: true });
    try {
      const loaded = await loadKineticFont(fontId);
      if (get().fontId === fontId) {
        set({
          font: loaded,
          loadedFontId: fontId,
          isFontLoading: false,
          isFontFailed: false,
        });
      }
    } catch {
      if (get().fontId === fontId) {
        set({
          isFontLoading: false,
          isFontFailed: true,
        });
      }
    }
  },

  reset: () => set(initialState),
}));
