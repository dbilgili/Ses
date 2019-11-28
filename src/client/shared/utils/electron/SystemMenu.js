/* eslint-disable import/prefer-default-export */

const { remote } = window.require('electron');

const { Menu, MenuItem } = remote;

class SystemMenu {
  constructor() {
    this.menu = new Menu();
  }

  create(items) {
    items.forEach((item) => {
      this.menu.append(new MenuItem(item));
    });
  }

  show(position) {
    this.menu.popup(position);
  }
}

export default SystemMenu;
