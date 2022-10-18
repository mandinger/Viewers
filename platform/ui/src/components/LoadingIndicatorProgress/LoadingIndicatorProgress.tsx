import React from 'react';
import classNames from 'classnames';
import { Icon } from '@ohif/ui';

import './LoadingIndicatorProgress.css';

function LoadingIndicatorProgress({ className, text }) {
  return (
    <div
      className={classNames(
        'absolute z-50 top-0 left-0 flex flex-col items-center justify-center',
        className
      )}
    >
      <Icon name="loading-ohif-mark" className="text-white w-12 h-12" />
      <div
        className="mt-6 rounded-md relative bg-primary-light shim-red"
        style={{
          width: '175px',
          height: '8px',
        }}
      ></div>
      <div className="mt-4 text-white text-sm">{text}</div>
    </div>
  );
}

export default LoadingIndicatorProgress;
