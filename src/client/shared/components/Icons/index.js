import PropTypes from 'prop-types';
import React from 'react';

import * as icons from '../../assets/index';

const Icons = (props) => {
  const { type, isDarkMode, isMondridanMode } = props;

  let Icon = null;

  if (!isDarkMode || isMondridanMode) {
    Icon = icons[`${type}Dark`];
  } else {
    Icon = icons[`${type}Light`];
  }

  return <Icon />;
};

Icons.propTypes = {
  type: PropTypes.string.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  isMondridanMode: PropTypes.bool.isRequired,
};

export default Icons;
