const { contextBridge, ipcRenderer } = require("electron");

// Flag utilisé par le frontend (Auth.tsx) pour masquer le bouton Google.
contextBridge.exposeInMainWorld("isCotramDesktop", true);

contextBridge.exposeInMainWorld("cotram", {
  retry: () => ipcRenderer.invoke("cotram:retry"),
  getUrl: () => ipcRenderer.invoke("cotram:get-url"),
});
