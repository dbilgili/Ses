/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/no-extraneous-dependencies
const { ipcMain } = require('electron');

class SpeakerIPC {
  constructor(speaker, speakerGroups, mainWindow, store) {
    this.speaker = speaker;
    this.mainWindow = mainWindow;
    this.speakerGroups = speakerGroups;
    this.store = store;
  }

  destroy() {
    ipcMain.removeAllListeners('PLAY_STATE');
    ipcMain.removeAllListeners('SET_MUTE_STATE');
    ipcMain.removeAllListeners('SET_VOLUME');
    ipcMain.removeAllListeners('NEXT_SONG');
    ipcMain.removeAllListeners('PREV_SONG');
    ipcMain.removeAllListeners('SET_SELECTED_SPEAKER_GROUP');
    this.removeSpeakerListeners();
  }

  removeSpeakerListeners = () => {
    this.speaker.sonos.removeAllListeners('Volume');
    this.speaker.sonos.removeAllListeners('CurrentTrack');
    this.speaker.sonos.removeAllListeners('Muted');
    this.speaker.sonos.removeAllListeners('PlayState');
  }

  onSpeakerUpdate = () => {
    this.speaker.sonos.on('Volume', (volume) => {
      this.mainWindow.webContents.send('GET_VOLUME', volume);
    });

    this.speaker.sonos.on('CurrentTrack', (currentTrack) => {
      this.mainWindow.webContents.send('CURRENT_TRACK', currentTrack);
    });

    this.speaker.sonos.on('Muted', (muteState) => {
      this.mainWindow.webContents.send('MUTE_STATE', muteState);
    });

    this.speaker.sonos.on('PlayState', (playState) => {
      this.mainWindow.webContents.send('PLAY_STATE', playState);
    });
  }

  noSpeakerDetected = () => {
    this.mainWindow.webContents.send('SELECTED_SPEAKER_GROUP', null);
    this.mainWindow.webContents.send('SPEAKER_GROUPS', []);
  }

  speakerCurrentInfo = async () => {
    const volume = await this.speaker.sonos.getVolume();
    const currentTrack = await this.speaker.sonos.currentTrack();
    const muteState = await this.speaker.sonos.getMuted();
    const playState = await this.speaker.sonos.getCurrentState();

    this.mainWindow.webContents.send('PLAY_STATE', playState);
    this.mainWindow.webContents.send('CURRENT_TRACK', currentTrack);
    this.mainWindow.webContents.send('GET_VOLUME', volume);
    this.mainWindow.webContents.send('MUTE_STATE', muteState);
  }

  connections = () => {
    this.destroy();

    this.onSpeakerUpdate();

    this.mainWindow.webContents.send('SPEAKER_GROUPS', this.speakerGroups);

    this.mainWindow.webContents.send('SELECTED_SPEAKER_GROUP', this.store.get('selectedSpeakerGroup'));

    ipcMain.on('PLAY_STATE', (event, arg) => {
      if (arg) {
        this.speaker.sonos.play();
      } else {
        this.speaker.sonos.pause();
      }
    });

    ipcMain.on('SET_MUTE_STATE', (event, arg) => {
      if (this.speaker.subGroups.length) {
        this.speaker.subGroups.forEach(group => group.setMuted(arg));
      } else {
        this.speaker.sonos.setMuted(arg);
      }
    });

    ipcMain.on('SET_VOLUME', (event, arg) => {
      if (this.speaker.subGroups.length) {
        this.speaker.subGroups.forEach(group => group.setVolume(arg));
      } else {
        this.speaker.sonos.setVolume(arg);
      }
    });

    ipcMain.on('NEXT_SONG', () => {
      this.speaker.sonos.next();
    });

    ipcMain.on('PREV_SONG', () => {
      this.speaker.sonos.previous();
    });

    ipcMain.on('SET_SELECTED_SPEAKER_GROUP', async (event, arg) => {
      this.store.set('selectedSpeakerGroup', arg);

      const { host, subGroups } = arg;

      try {
        this.removeSpeakerListeners();
        await this.speaker.connectToKnownSpeaker(host, subGroups);
        await this.speakerCurrentInfo();
        this.onSpeakerUpdate();
      } catch (e) {
        throw Error(e);
      }
    });
  }

  start = () => {
    if (this.speaker.sonos) {
      this.mainWindow.webContents.on('did-finish-load', () => this.connections());
    }
  }
}

module.exports = SpeakerIPC;
