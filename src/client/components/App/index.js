/* eslint-disable react/destructuring-assignment */
import classnames from 'classnames';
import React from 'react';

import { ipcRenderer, SystemMenu } from '../../shared/utils/electron';

import Controllers from '../Controllers';
import Footer from '../Footer';

import styles from './styles.sass';

class App extends React.Component {
  constructor() {
    super();

    this.speakerGroupsMenu = null;

    this.state = {
      darkTheme: false,
      mondrianTheme: false,
      launchAtStart: true,
      speakerGroups: [],
      currentTrack: {
        artist: '',
        title: ''
      },
      selectedGroup: {
        id: '',
        name: '',
        isSubGroup: false
      }
    };
  }

  componentDidMount() {
    this.createSelectGroupsMenu();

    ipcRenderer.on('SPEAKER_GROUPS', (event, speakerGroups) => {
      this.setState({ speakerGroups }, () => {
        this.createSelectGroupsMenu();
        this.autoSelectGroup();
      });
    });

    ipcRenderer.on('SELECTED_SPEAKER_GROUP', (event, selectedSpeakerGroup) => {
      if (selectedSpeakerGroup) {
        this.setState({
          selectedGroup: {
            id: selectedSpeakerGroup.id,
            name: selectedSpeakerGroup.name
          }
        }, () => {
          this.autoSelectGroup();
        });
      } else {
        this.setState({
          selectedGroup: {
            id: '',
            name: '',
            isSubGroup: false
          }
        });
      }
    });

    ipcRenderer.on('CURRENT_TRACK', (event, currentTrack) => {
      this.setState({
        currentTrack: {
          artist: currentTrack.artist,
          title: currentTrack.title
        }
      });
    });

    ipcRenderer.on('DARK_THEME', (event, darkTheme) => {
      this.setState({
        darkTheme
      });
    });

    ipcRenderer.on('IS_MONDRIAN_THEME', (event, mondrianTheme) => {
      this.setState({
        mondrianTheme
      });
    });

    ipcRenderer.on('LAUNCH_AT_STARTUP', (event, launchAtStart) => {
      this.setState({
        launchAtStart
      });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('SPEAKER_GROUPS');
    ipcRenderer.removeAllListeners('SELECTED_SPEAKER_GROUP');
    ipcRenderer.removeAllListeners('CURRENT_TRACK');
    ipcRenderer.removeAllListeners('DARK_THEME');
    ipcRenderer.removeAllListeners('IS_MONDRIAN_THEME');
    ipcRenderer.removeAllListeners('LAUNCH_AT_STARTUP');
  }

  autoSelectGroup = () => {
    const { speakerGroups, selectedGroup } = this.state;

    if (speakerGroups.length === 1) {
      this.setSelectedGroup(speakerGroups[0]);
    } else if (selectedGroup.id) {
      const speakerGroupInfo = speakerGroups.filter(group => group.ID === selectedGroup.id);
      if (speakerGroupInfo.length > 0) {
        this.setSelectedGroup(speakerGroupInfo[0]);
      }
    }
  }

  setSelectedGroup = (group) => {
    const {
      Name,
      host,
      ID,
      subGroups,
      isSubGroup,
    } = group;

    this.setState({
      selectedGroup: {
        id: ID,
        name: Name,
        isSubGroup,
      }
    }, () => {
      this.createSelectGroupsMenu();
      ipcRenderer.send('SET_SELECTED_SPEAKER_GROUP', {
        host,
        id: ID,
        subGroups,
      });
    });
  }

  createSelectGroupsMenu = () => {
    const { speakerGroups, selectedGroup } = this.state;
    const menu = new SystemMenu();
    const menuItems = [];

    speakerGroups.forEach((group) => {
      let subGroups = [];

      // eslint-disable-next-line no-prototype-builtins
      if (group.hasOwnProperty('subGroups')) {
        subGroups = group.subGroups.map(item => ({
          label: selectedGroup.name === item.Name ? ` |- ${item.Name} ✓` : ` |- ${item.Name}`,
          type: 'normal',
          click: () => this.setSelectedGroup(item)
        }));
      }

      menuItems.push(
        {
          label: selectedGroup.name === group.Name ? `${group.Name} ✓` : group.Name,
          type: 'normal',
          click: () => this.setSelectedGroup(group)
        },
        ...subGroups
      );
    });

    menuItems.unshift(...[
      {
        label: 'Available Groups:',
        enabled: false,
      },
      {
        type: 'separator',
      },
    ]);

    menuItems.push(...[
      {
        type: 'separator',
      },
      {
        label: 'Refresh',
        click: this.refreshSpeakers
      },
    ]);

    menu.create(menuItems);
    this.speakerGroupsMenu = menu;
  }

  setCustomTheme = (arg) => {
    this.setState({ mondrianTheme: arg }, () => {
      ipcRenderer.send('SET_MONDRIAN_THEME', arg);
    });
  }

  setLaunchAtStart = (arg) => {
    this.setState({ launchAtStart: arg }, () => {
      ipcRenderer.send('SET_LAUNCH_AT_STARTUP', arg);
    });
  }

  refreshSpeakers = () => {
    this.setState({
      selectedGroup: {
        id: 'loading',
        name: 'Loading..',
        isSubGroup: false
      }
    }, () => ipcRenderer.send('REFRESH_SPEAKERS'));
  }

  render() {
    const {
      currentTrack,
      darkTheme,
      mondrianTheme,
      launchAtStart,
      selectedGroup: {
        id,
        name,
        isSubGroup
      },
    } = this.state;

    return (
      <div className={classnames(
        styles.appWrapper,
        darkTheme && styles.darkTheme,
        mondrianTheme && styles.mondrianTheme
      )}
      >
        <div className={styles.header}>
          <button
            type="button"
            className={classnames(styles.groupSelector, id === 'loading' ? styles.loading : null)}
            onClick={() => this.speakerGroupsMenu.show({ x: 100, y: 35 })}
          >
            {name || 'Select a group'}
          </button>
        </div>
        <Controllers
          themes={{ darkTheme, mondrianTheme }}
          disableControls={!!isSubGroup}
        />
        <Footer
          themes={{ darkTheme, mondrianTheme }}
          launchAtStart={launchAtStart}
          currentTrack={currentTrack}
          setCustomTheme={this.setCustomTheme}
          setLaunchAtStart={this.setLaunchAtStart}
          disableCurrentTrack={!!isSubGroup}
        />
      </div>
    );
  }
}

export default App;
