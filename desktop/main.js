const { app, BrowserWindow, Menu, shell, ipcMain, session } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const CONFIG_PATH = path.join(__dirname, "config.json");
const OFFLINE_PAGE = path.join(__dirname, "offline.html");
const WINDOW_BOUNDS_FILE = path.join(app.getPath("userData"), "window-bounds.json");

function resolveStartUrl() {
  if (process.env.COTRAM_URL) return process.env.COTRAM_URL;
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    if (cfg && typeof cfg.url === "string" && cfg.url) return cfg.url;
  } catch (err) {
    console.error("Lecture config.json impossible:", err);
  }
  return "https://api.nragency.tech";
}

function loadWindowBounds() {
  try {
    const raw = fs.readFileSync(WINDOW_BOUNDS_FILE, "utf8");
    const b = JSON.parse(raw);
    if (b && typeof b.width === "number" && typeof b.height === "number") {
      return b;
    }
  } catch {
    // premier lancement : pas de bounds sauvegardés
  }
  return { width: 1280, height: 800 };
}

function saveWindowBounds(win) {
  try {
    if (win.isMaximized() || win.isFullScreen()) return;
    fs.writeFileSync(WINDOW_BOUNDS_FILE, JSON.stringify(win.getBounds()));
  } catch {
    // best-effort
  }
}

let mainWindow = null;
let currentUrl = resolveStartUrl();

function isExternalUrl(target) {
  if (!target) return false;
  if (target.startsWith("mailto:") || target.startsWith("tel:")) return true;
  try {
    const u = new URL(target);
    return u.protocol !== "http:" && u.protocol !== "https:";
  } catch {
    return false;
  }
}

function openExternal(target) {
  if (isExternalUrl(target)) {
    shell.openExternal(target);
    return true;
  }
  return false;
}

function buildMenu(win) {
  const template = [
    {
      label: "Navigation",
      submenu: [
        { label: "Retour", accelerator: "Alt+Left", click: () => win.webContents.canGoBack() && win.webContents.goBack() },
        { label: "Suivant", accelerator: "Alt+Right", click: () => win.webContents.canGoForward() && win.webContents.goForward() },
        { type: "separator" },
        { label: "Actualiser", accelerator: "F5", click: () => reload(win) },
        { type: "separator" },
        { label: "Imprimer…", accelerator: "Ctrl+P", click: () => win.webContents.print({ silent: false }) },
      ],
    },
    {
      label: "Affichage",
      submenu: [
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "resetZoom" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { type: "separator" },
        { role: "toggleDevTools", visible: process.env.COTRAM_DEV === "1" },
      ],
    },
    {
      label: "Fenêtre",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function reload(win) {
  win.loadURL(currentUrl).catch(() => showOffline(win));
}

function showOffline(win) {
  if (win.isDestroyed()) return;
  win.loadFile(OFFLINE_PAGE).catch(() => {});
}

function createWindow() {
  const bounds = loadWindowBounds();
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 960,
    minHeight: 600,
    show: false,
    backgroundColor: "#111827",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  buildMenu(mainWindow);

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.on("close", () => saveWindowBounds(mainWindow));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Empêche l'ouverture de fenêtres internes -> navigateur système
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Liens externes (http vers un autre domaine, mailto, tel) -> navigateur
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (openExternal(url)) {
      event.preventDefault();
      return;
    }
    if (url.startsWith("file://")) {
      // page hors-ligne locale : laisser faire
      return;
    }
  });

  mainWindow.webContents.on("did-fail-load", (_e, errorCode, errorDesc, validatedURL) => {
    // -3 = ERR_ABORTED (navigation annulée, normal pendant changement de page)
    if (errorCode === -3) return;
    console.error(`Chargement échoué (${errorCode} ${errorDesc}): ${validatedURL}`);
    showOffline(mainWindow);
  });

  mainWindow.loadURL(currentUrl).catch(() => showOffline(mainWindow));
}

// ─── Single instance lock ────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  ipcMain.handle("cotram:retry", () => {
    currentUrl = resolveStartUrl();
    if (mainWindow) reload(mainWindow);
    return true;
  });

  ipcMain.handle("cotram:get-url", () => currentUrl);

  app.whenReady().then(() => {
    // Pas de Cache HTTP agressif : le site est mise à jour côté serveur
    session.defaultSession.setCachePath?.("");

    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
