//@ts-nocheck

import * as React from 'react';
import clsx from 'clsx';
import { capitalize, styled } from '@mui/material';

export function isHorizontal(anchor: string) {
    return ['left', 'right'].indexOf(anchor) !== -1;
}

const SwipeAreaRoot = styled('div')(({ theme, ownerState }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  zIndex: theme.zIndex.drawer - 1,
  ...(ownerState.anchor === 'left' && {
    right: 'auto',
  }),
  ...(ownerState.anchor === 'right' && {
    left: 'auto',
    right: 0,
  }),
  ...(ownerState.anchor === 'top' && {
    bottom: 'auto',
    right: 0,
  }),
  ...(ownerState.anchor === 'bottom' && {
    top: 'auto',
    bottom: 0,
    right: 0,
  }),
}));

/**
 * @ignore - internal component.
 */
const SwipeArea = React.forwardRef(function SwipeArea(props, ref) {
  const { anchor, classes = {}, className, width, style, ...other } = props;

  const ownerState = props;

  return (
    <SwipeAreaRoot
      className={clsx(
        'PrivateSwipeArea-root',
        classes.root,
        classes[`anchor${capitalize(anchor)}`],
        className,
      )}
      ref={ref}
      style={{
        [isHorizontal(anchor) ? 'width' : 'height']: width,
        ...style,
      }}
      ownerState={ownerState}
      {...other}
    />
  );
});

export default SwipeArea;