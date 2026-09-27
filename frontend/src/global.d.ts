// Détecte la version bureau (Electron) — exposé par desktop/preload.js
interface Window {
  isCotramDesktop?: boolean;
  cotram?: {
    retry: () => Promise<unknown>;
    getUrl: () => Promise<string>;
  };
}
