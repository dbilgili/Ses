// eslint-disable-next-line import/no-extraneous-dependencies
const { Tray, Menu } = require('electron');
const path = require('path');

class TrayGenerator {
  constructor(mainWindow, aboutWindow) {
    this.tray = null;
    this.mainWindow = mainWindow;
    this.aboutWindow = aboutWindow;
  }

  getWindowPosition = () => {
    const windowBounds = this.mainWindow.getBounds();
    const trayBounds = this.tray.getBounds();

    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
    const y = Math.round(trayBounds.y + trayBounds.height);
    return { x, y };
  };

  showWindow = () => {
    const position = this.getWindowPosition();
    this.mainWindow.setPosition(position.x, position.y, false);
    this.mainWindow.show();
    this.mainWindow.setVisibleOnAllWorkspaces(true); // put the window on all screens
    this.mainWindow.focus(); // focus the window up front on the active screen
    this.mainWindow.setVisibleOnAllWorkspaces(false); // disable all screen behavior
  };

  toggleWindow = () => {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
      this.mainWindow.focus();
    }

    if (this.aboutWindow) {
      this.aboutWindow.blur();
    }
  };

  rightClickMenu = () => {
    const menu = [
      {
        role: 'quit',
        accelerator: 'Command+Q'
      }
    ];

    this.tray.popUpContextMenu(Menu.buildFromTemplate(menu));
  }

  createTray = () => {
    this.tray = new Tray(path.join(__dirname, './assets/IconTemplate.png'));

    this.tray.setIgnoreDoubleClickEvents(true);

    this.tray.on('click', () => {
      this.toggleWindow();
    });

    this.tray.on('right-click', this.rightClickMenu);
  };
}

module.exports = TrayGenerator;
