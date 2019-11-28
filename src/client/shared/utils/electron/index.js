/* eslint-disable import/prefer-default-export */
const { ipcRenderer, shell } = window.require('electron');

export { default as SystemMenu } from './SystemMenu';
export { ipcRenderer };
export { shell };
