import React from 'react';

export default function defaultRowRenderer({rowIndex, ...props}) {
  return React.createElement('div', props);
}
