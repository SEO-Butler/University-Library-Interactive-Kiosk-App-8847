import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

// Icons are passed as components (named imports) so the bundler only includes the
// icons that are actually used.
const SafeIcon = ({ icon: IconComponent, ...props }) => {
  return IconComponent
    ? React.createElement(IconComponent, props)
    : <FiAlertTriangle {...props} />;
};

export default SafeIcon;
