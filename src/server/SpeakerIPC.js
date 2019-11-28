// eslint-disable-next-line import/no-extraneous-dependencies
const { ipcMain } = require('electron');

class SpeakerIPC {
  constructor(speaker, speakerGroups, mainWindow, store) {
    this.speaker = speaker;
    this.mainWindow = mainWindow;
    this.speakerGroups = speakerGroups;
    this.store = store;
  }

  sentFromSpeaker = () => {
    this.speaker.sonos.on('Volume', (volume) => {
      this.mainWindow.webContents.send('GET_VOLUME', volume);
    });

    this.speaker.sonos.on('CurrentTrack', (currentTrack) => {
      this.mainWindow.webContents.send('GET_CURRENT_TRACK', currentTrack);
    });

    this.speaker.sonos.on('Muted', (muteState) => {
      this.mainWindow.webContents.send('MUTE_STATE', muteState);
    });

    this.speaker.sonos.on('PlayState', (playState) => {
      this.mainWindow.webContents.send('PLAY_STATE', playState);
    });
  }

  connections = () => {
    this.sentFromSpeaker();

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
        await this.speaker.connectToKnownSpeaker(host, subGroups);
        this.sentFromSpeaker();
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
