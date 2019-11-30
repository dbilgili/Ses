// eslint-disable-next-line import/no-extraneous-dependencies
const { app, BrowserWindow, globalShortcut } = require('electron');
const { is } = require('electron-util');

const path = require('path');

const Store = require('electron-store');
const Speaker = require('./Speaker');
const SpeakerIPC = require('./SpeakerIPC');
const ClientIPC = require('./ClientIPC');
const TrayGenerator = require('./TrayGenerator');

let mainWindow = null;
let aboutWindow = null;
let speaker = null;

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
    webPreferences: {
      devTools: is.development,
      nodeIntegration: true,
      backgroundThrottling: false
    }
  });

  aboutWindow.setMinimizable(false);
  aboutWindow.setMaximizable(false);
  aboutWindow.setResizable(false);

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

  mainWindow.on('blur', () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });
};

const commenceSpeakerIPC = async (isRefresh) => {
  speaker = new Speaker();
  const groups = await speaker.listSpeakers();

  const speakerIPC = new SpeakerIPC(speaker, groups, mainWindow, store);

  if (speaker.sonos) {
    if (isRefresh) {
      speakerIPC.connections();
    } else {
      speakerIPC.start();
    }
  } else {
    speakerIPC.noSpeakerDetected();
  }
};

const commenceClientIPC = async () => {
  const clientIPC = new ClientIPC(mainWindow, aboutWindow, store, app, commenceSpeakerIPC);
  clientIPC.start();
};

const createTray = () => {
  const trayObject = new TrayGenerator(mainWindow, aboutWindow);
  trayObject.createTray();

  trayObject.tray.on('click', async () => {
    if (mainWindow.isVisible() && speaker.sonos) {
      const volume = await speaker.sonos.getVolume();
      mainWindow.webContents.send('GET_VOLUME', volume);

      const currentTrack = await speaker.sonos.currentTrack();
      mainWindow.webContents.send('GET_CURRENT_TRACK', currentTrack);

      const muteState = await speaker.sonos.getMuted();
      mainWindow.webContents.send('MUTE_STATE', muteState);

      const playState = await speaker.sonos.getCurrentState();
      mainWindow.webContents.send('PLAY_STATE', playState);
    }
  });
};

app.dock.hide();

app.on('ready', () => {
  createAboutWindow();
  createMainWindow();
  commenceClientIPC();
  commenceSpeakerIPC(false);
  createTray();
  globalShortcut.register('Command+R', () => null);
});

app.on('before-quit', () => {
  aboutWindow.destroy();
});

if (!is.development) {
  app.setLoginItemSettings({
    openAtLogin: store.get('launchAtStart'),
  });
}
