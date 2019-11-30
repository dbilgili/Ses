/* eslint-disable no-nested-ternary */
/* eslint-disable react/destructuring-assignment */
import PropTypes from 'prop-types';
import classnames from 'classnames';
import React from 'react';
import { ipcRenderer } from '../../shared/utils/electron';
import Icons from '../../shared/components/Icons';

import styles from './styles.sass';

class Controllers extends React.Component {
  constructor() {
    super();
    this.state = {
      volume: '',
      playState: undefined,
      muteState: undefined,
    };
  }

  componentDidMount() {
    ipcRenderer.on('GET_VOLUME', (event, volume) => this.setState({ volume }));
    ipcRenderer.on('MUTE_STATE', (event, muteState) => this.setState({ muteState }));
    ipcRenderer.on('PLAY_STATE', (event, playState) => {
      this.setState({
        playState: playState === 'playing' ? 1 : 0
      });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('GET_VOLUME');
    ipcRenderer.removeAllListeners('MUTE_STATE');
    ipcRenderer.removeAllListeners('PLAY_STATE');
  }

  setVolume = (e) => {
    this.setState({ volume: e.target.value }, () => {
      ipcRenderer.send('SET_VOLUME', this.state.volume);
    });
  }

  mute = () => {
    this.setState(prevState => ({
      muteState: !prevState.muteState
    }), () => {
      ipcRenderer.send('SET_MUTE_STATE', this.state.muteState);
    });
  }

  togglePlayState = () => {
    this.setState(prevState => ({
      playState: !prevState.playState
    }), () => {
      ipcRenderer.send('PLAY_STATE', this.state.playState);
    });
  }

  changeSong = (direction) => {
    if (direction === 1) {
      ipcRenderer.send('NEXT_SONG');
    } else {
      ipcRenderer.send('PREV_SONG');
    }
  }

  render() {
    const {
      volume,
      playState,
      muteState,
    } = this.state;

    const { disableControls } = this.props;

    const { themes: { darkTheme, mondrianTheme } } = this.props;

    return (
      <div className={styles.controllers}>
        <div className={classnames(
          styles.volumeControllers,
          darkTheme && styles.darkTheme,
          mondrianTheme && styles.mondrianTheme
        )}
        >
          <button
            type="button"
            className={styles.muteButton}
            onClick={this.mute}
          >
            {muteState
              ? <Icons type="Muted" isDarkMode={darkTheme} isMondridanMode={mondrianTheme} />
              : <Icons type="VolumeOn" isDarkMode={darkTheme} isMondridanMode={mondrianTheme} />
            }
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            className={classnames(
              styles.rangeSlider,
              darkTheme && styles.darkTheme,
              mondrianTheme && styles.mondrianTheme
            )}
            onChange={this.setVolume}
          />
        </div>
        <div className={classnames(
          styles.controlButtonsWrapper,
          darkTheme && styles.darkTheme,
          mondrianTheme && styles.mondrianTheme
        )}
        >
          <button
            type="button"
            className={classnames(styles.controlButtons, disableControls ? styles.disabled : null)}
            onClick={disableControls ? null : () => this.changeSong(-1)}
          >
            <Icons type="Prev" isDarkMode={darkTheme} isMondridanMode={mondrianTheme} />
          </button>
          <button
            className={classnames(styles.controlButtons, disableControls ? styles.disabled : null)}
            type="button"
            onClick={disableControls ? null : this.togglePlayState}
          >
            {playState
              ? <Icons type="Pause" isDarkMode={darkTheme} isMondridanMode={mondrianTheme} />
              : <Icons type="Play" isDarkMode={darkTheme} isMondridanMode={mondrianTheme} />
            }
          </button>
          <button
            type="button"
            className={classnames(styles.controlButtons, disableControls ? styles.disabled : null)}
            onClick={disableControls ? null : () => this.changeSong(1)}
          >
            <Icons type="Next" isDarkMode={darkTheme} isMondridanMode={mondrianTheme} />
          </button>
        </div>
      </div>
    );
  }
}

Controllers.propTypes = {
  themes: PropTypes.objectOf(PropTypes.any).isRequired,
  disableControls: PropTypes.bool.isRequired
};

export default Controllers;
