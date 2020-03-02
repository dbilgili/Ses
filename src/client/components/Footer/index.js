import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { ipcRenderer, SystemMenu } from '../../shared/utils/electron';
import styles from './styles.sass';

import Icons from '../../shared/components/Icons';

class Footer extends React.Component {
  constructor(props) {
    super(props);
    const { setCustomTheme, setLaunchAtStart } = props;

    this.menu = null;

    this.menuItems = [
      {
        label: 'About',
        type: 'normal',
        click: () => ipcRenderer.send('OPEN_ABOUT_WINDOW'),
      },
      {
        type: 'separator',
      },
      {
        label: 'Mondrian theme',
        type: 'checkbox',
        checked: false,
        click: event => setCustomTheme(event.checked),
      },
      {
        type: 'separator',
      },
      {
        label: 'Launch at startup',
        type: 'checkbox',
        checked: true,
        click: event => setLaunchAtStart(event.checked),
      },
      {
        type: 'separator',
      },
      {
        label: 'Quit',
        type: 'normal',
        role: 'quit',
      },
    ];
  }

  componentDidMount() {
    this.createMenu();
  }

  componentDidUpdate(prevProps) {
    const { launchAtStart, themes: { mondrianTheme } } = this.props;
    if (prevProps.themes.mondrianTheme !== mondrianTheme) {
      this.menuItems[2].checked = mondrianTheme;
    }
    if (prevProps.launchAtStart !== launchAtStart) {
      this.menuItems[4].checked = launchAtStart;
    }
    this.createMenu();
  }

  createMenu = () => {
    this.menu = new SystemMenu();
    this.menu.create(this.menuItems);
  }

  render() {
    const {
      currentTrack: { title, artist },
      themes: { darkTheme, mondrianTheme },
      disableCurrentTrack
    } = this.props;

    return (
      <div className={classnames(
        styles.footerWrapper,
        darkTheme && styles.darkTheme,
        mondrianTheme && styles.mondrianTheme
      )}
      >
        <button
          type="button"
          className={styles.settingsIcon}
          onClick={() => this.menu.show({ x: 200, y: 180 })}
        >
          <Icons type="Settings" isDarkMode={darkTheme} isMondridanMode={mondrianTheme} />
        </button>
        {!disableCurrentTrack && (
          <div className={styles.currentTrack}>
            {title && <span title={title}>{title}</span>}
            {artist && <span title={artist}>{artist}</span>}
          </div>
        )}
      </div>
    );
  }
}

Footer.propTypes = {
  currentTrack: PropTypes.objectOf(PropTypes.any).isRequired,
  setCustomTheme: PropTypes.func.isRequired,
  setLaunchAtStart: PropTypes.func.isRequired,
  themes: PropTypes.objectOf(PropTypes.any).isRequired,
  launchAtStart: PropTypes.bool.isRequired,
  disableCurrentTrack: PropTypes.bool.isRequired
};

export default Footer;
