import React from 'react';
import styles from './styles.sass';
import { shell } from '../../shared/utils/electron';
import pkg from '../../../../package.json';

import Icons from '../../shared/components/Icons';

const About = () => (
  <div className={styles.about}>
    <div className={styles.logo}>
      <Icons type="Logo" isDarkMode={false} isMondridanMode={false} />
    </div>
    <span className={styles.appName}>Ses</span>
    <span className={styles.appDetails}>{`Version ${pkg.version}`}</span>
    <button
      type="button"
      onClick={() => shell.openExternal('https://github.com/dbilgili/ses')}
      className={styles.repo}
    >
      Source Code
    </button>
  </div>
);

export default About;
