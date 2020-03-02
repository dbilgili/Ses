/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
// eslint-disable-next-line import/no-extraneous-dependencies
const {
  app,
  BrowserWindow,
  globalShortcut,
} = require('electron');
const { Listener } = require('sonos');
const { is } = require('electron-util');
const path = require('path');

const Store = require('electron-store');
const Speaker = require('./Speaker');
const SpeakerIPC = require('./SpeakerIPC');
const ClientIPC = require('./ClientIPC');
const TrayGenerator = require('./TrayGenerator');

let mainWindow = null;
let aboutWindow = null;
let trayObject = null;
let speaker = null;
let speakerIPC = null;

const gotTheLock = app.requestSingleInstanceLock();

const store = new Store();

if (store.get('launchAtStart') === undefined && !is.development) {
  store.set('launchAtStart', true);
}

const createAboutWindow = () => {
  aboutWindow = new BrowserWindow({
    alwaysOnTop: true,
    backgroundColor: '#ECECEC',
    width: 230,
    show: false,
    height: 185,
    resizable: is.development,
    title: 'About',
    minimizable: false,
    maximizable: false,
    webPreferences: {
      devTools: is.development,
      nodeIntegration: true,
      backgroundThrottling: false
    }
  });

  aboutWindow.on('focus', () => {
    globalShortcut.register('Command+R', () => null);
  });

  aboutWindow.on('blur', () => {
    globalShortcut.unregister('Command+R');
  });

  aboutWindow.on('close', (e) => {
    e.preventDefault();
    aboutWindow.hide();
  });

  if (is.development) {
    aboutWindow.loadURL('http://localhost:3000/?screen=about');
  } else {
    aboutWindow.loadURL(`file://${path.join(__dirname, '../../build/index.html?screen=about')}`);
  }
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    backgroundColor: '#FFFFFF',
    width: 230,
    height: 185,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: is.development,
    webPreferences: {
      devTools: is.development,
      nodeIntegration: true,
      backgroundThrottling: false
    }
  });

  if (is.development) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    mainWindow.loadURL('http://localhost:3000/?screen=main');
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, '../../build/index.html?screen=main')}`);
  }

  mainWindow.on('focus', () => {
    globalShortcut.register('Command+R', () => null);
  });

  mainWindow.on('blur', () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
      globalShortcut.unregister('Command+R');
    }
  });
};

const commenceSpeakerIPC = async (isRefresh) => {
  speaker = new Speaker();

  const groups = await speaker.listSpeakers();

  speakerIPC = new SpeakerIPC(speaker, groups, mainWindow, store);

  if (speaker.sonos) {
    if (isRefresh) {
      speakerIPC.connections();
    } else {
      speakerIPC.start();
    }
  } else if (!speaker.sonos && !isRefresh) {
    speakerIPC.noSpeakerDetected();
  } else {
    await commenceSpeakerIPC(true);
  }
};

const commenceClientIPC = async () => {
  const clientIPC = new ClientIPC(mainWindow, aboutWindow, store, app, commenceSpeakerIPC);
  clientIPC.start();
};

const createTray = () => {
  trayObject = new TrayGenerator(mainWindow, aboutWindow);
  trayObject.createTray();

  trayObject.tray.on('click', async () => {
    if (mainWindow.isVisible() && speaker.sonos) {
      speakerIPC.speakerCurrentInfo();
    }
  });
};

if (!gotTheLock) {
  app.quit();
} else {
  app.on('ready', async () => {
    createAboutWindow();
    createMainWindow();
    await commenceClientIPC();
    await commenceSpeakerIPC(false);
    createTray();

    const { powerMonitor } = require('electron');

    // Refresh to update the possibly expired UPnP subscription.
    powerMonitor.on('resume', async () => {
      await commenceSpeakerIPC(true);
    });
  });

  app.on('second-instance', () => {
    if (mainWindow) {
      trayObject.showWindow();
    }
  });

  app.on('before-quit', () => {
    aboutWindow.destroy();
  });

  if (!is.development) {
    app.setLoginItemSettings({
      openAtLogin: store.get('launchAtStart'),
    });
  }

  app.dock.hide();
}
