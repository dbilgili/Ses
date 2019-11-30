// eslint-disable-next-line import/no-extraneous-dependencies
const { ipcMain, systemPreferences } = require('electron');

class ClientIPC {
  constructor(mainWindow, aboutWindow, store, app, speakerIPC) {
    this.mainWindow = mainWindow;
    this.aboutWindow = aboutWindow;
    this.store = store;
    this.app = app;
    this.speakerIPC = speakerIPC;
  }

  darkTheme = () => {
    this.mainWindow.webContents.send('DARK_THEME', systemPreferences.isDarkMode());
    this.mainWindow.setBackgroundColor('#48484A');
  }

  start = () => {
    this.mainWindow.webContents.on('did-finish-load', () => {
      systemPreferences.subscribeNotification(
        'AppleInterfaceThemeChangedNotification', () => this.darkTheme()
      );

      if (systemPreferences.isDarkMode()) {
        this.darkTheme();
      }

      ipcMain.on('OPEN_ABOUT_WINDOW', () => {
        if (this.aboutWindow.isVisible()) {
          this.aboutWindow.hide();
          this.aboutWindow.show();
        } else {
          this.aboutWindow.show();
        }
      });

      ipcMain.on('SET_MONDRIAN_THEME', (event, arg) => {
        this.store.set('isMondrianTheme', arg);
      });

      ipcMain.on('SET_LAUNCH_AT_STARTUP', (event, arg) => {
        this.store.set('launchAtStart', arg);
        this.app.setLoginItemSettings({
          openAtLogin: !!this.store.get('launchAtStart'),
        });
      });

      ipcMain.on('REFRESH_SPEAKERS', () => {
        this.speakerIPC(true);
      });

      this.mainWindow.webContents.send('IS_MONDRIAN_THEME', !!this.store.get('isMondrianTheme'));
      this.mainWindow.webContents.send('LAUNCH_AT_STARTUP', !!this.store.get('launchAtStart'));
    });
  }
}

module.exports = ClientIPC;
