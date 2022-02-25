//@ts-nocheck

import React from 'react';
import { Drawer, DrawerProps, duration, ownerWindow, useEventCallback, useTheme, unstable_useEnhancedEffect as useEnhancedEffect, NoSsr, useThemeProps } from '@mui/material';
import SwipeArea, { isHorizontal } from './SwipeArea';

function ownerDocument(node: Node | null | undefined): HTMLElement {
  //return (node && node.ownerDocument) || document;
  return window._BANDCAMP_COLLECTOR_SHADOW_DOM as unknown as HTMLElement;
}

const oppositeDirection = {
  left: 'right',
  right: 'left',
  top: 'down',
  bottom: 'up'
};

export function getAnchor(theme, anchor) {
  return theme.direction === 'rtl' && isHorizontal(anchor) ? oppositeDirection[anchor] : anchor;
}

export function getTransitionProps(props, options) {
  var _style$transitionDura, _style$transitionTimi;

  const {
    timeout,
    easing,
    style = {}
  } = props;
  return {
    duration: (_style$transitionDura = style.transitionDuration) != null ? _style$transitionDura : typeof timeout === 'number' ? timeout : timeout[options.mode] || 0,
    easing: (_style$transitionTimi = style.transitionTimingFunction) != null ? _style$transitionTimi : typeof easing === 'object' ? easing[options.mode] : easing,
    delay: style.transitionDelay
  };
}

export interface SwipeableDrawerProps extends Omit<DrawerProps, 'onClose' | 'open'> {
  /**
   * Disable the backdrop transition.
   * This can improve the FPS on low-end devices.
   * @default false
   */
  disableBackdropTransition?: boolean;
  /**
   * If `true`, touching the screen near the edge of the drawer will not slide in the drawer a bit
   * to promote accidental discovery of the swipe gesture.
   * @default false
   */
  disableDiscovery?: boolean;
  /**
   * If `true`, swipe to open is disabled. This is useful in browsers where swiping triggers
   * navigation actions. Swipe to open is disabled on iOS browsers by default.
   * @default typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
   */
  disableSwipeToOpen?: boolean;
  /**
   * Affects how far the drawer must be opened/closed to change its state.
   * Specified as percent (0-1) of the width of the drawer
   * @default 0.52
   */
  hysteresis?: number;
  /**
   * Defines, from which (average) velocity on, the swipe is
   * defined as complete although hysteresis isn't reached.
   * Good threshold is between 250 - 1000 px/s
   * @default 450
   */
  minFlingVelocity?: number;
  /**
   * Callback fired when the component requests to be closed.
   *
   * @param {React.SyntheticEvent<{}>} event The event source of the callback.
   */
  onClose: React.ReactEventHandler<{}>;
  /**
   * Callback fired when the component requests to be opened.
   *
   * @param {React.SyntheticEvent<{}>} event The event source of the callback.
   */
  onOpen: React.ReactEventHandler<{}>;
  /**
   * If `true`, the component is shown.
   */
  open: boolean;
  /**
   * The element is used to intercept the touch events on the edge.
   */
  SwipeAreaProps?: object;
  /**
   * The width of the left most (or right most) area in `px` that
   * the drawer can be swiped open from.
   * @default 20
   */
  swipeAreaWidth?: number;
  /**
   * Callback for drawer percent open change.
   */
  onPercentOpenUpdate?: (percentOpen: number) => void;
  onInnerDrawerOpenUpdate?: (open: boolean) => void;
}

// This value is closed to what browsers are using internally to
// trigger a native scroll.
const UNCERTAINTY_THRESHOLD = 3; // px

// This is the part of the drawer displayed on touch start.
const DRAG_STARTED_SIGNAL = 20; // px

// We can only have one instance at the time claiming ownership for handling the swipe.
// Otherwise, the UX would be confusing.
// That's why we use a singleton here.
let claimedSwipeInstance = null;

// Exported for test purposes.
export function reset() {
  claimedSwipeInstance = null;
}

function calculateCurrentX(anchor, touches, doc) {
  return anchor === 'right' ? doc.body.offsetWidth - touches[0].pageX : touches[0].pageX;
}

function calculateCurrentY(anchor, touches, containerWindow) {
  return anchor === 'bottom'
    ? containerWindow.innerHeight - touches[0].clientY
    : touches[0].clientY;
}

function getMaxTranslate(horizontalSwipe, paperInstance) {
  return horizontalSwipe ? paperInstance.clientWidth : paperInstance.clientHeight;
}

function getTranslate(currentTranslate, startLocation, open, maxTranslate) {
  return Math.min(
    Math.max(
      open ? startLocation - currentTranslate : maxTranslate + startLocation - currentTranslate,
      0,
    ),
    maxTranslate,
  );
}

/**
 * @param {Element | null} element
 * @param {Element} rootNode
 */
function getDomTreeShapes(element, rootNode) {
  // Adapted from https://github.com/oliviertassinari/react-swipeable-views/blob/7666de1dba253b896911adf2790ce51467670856/packages/react-swipeable-views/src/SwipeableViews.js#L129
  const domTreeShapes = [];

  while (element && element !== rootNode.parentElement) {
    // TODO change this?
    const style = ownerWindow(rootNode).getComputedStyle(element);

    if (
      // Ignore the scroll children if the element is absolute positioned.
      style.getPropertyValue('position') === 'absolute' ||
      // Ignore the scroll children if the element has an overflowX hidden
      style.getPropertyValue('overflow-x') === 'hidden'
    ) {
      // noop
    } else if (
      (element.clientWidth > 0 && element.scrollWidth > element.clientWidth) ||
      (element.clientHeight > 0 && element.scrollHeight > element.clientHeight)
    ) {
      // Ignore the nodes that have no width.
      // Keep elements with a scroll
      domTreeShapes.push(element);
    }

    element = element.parentElement;
  }

  return domTreeShapes;
}

/**
 * @param {object} param0
 * @param {ReturnType<getDomTreeShapes>} param0.domTreeShapes
 */
function computeHasNativeHandler({ domTreeShapes, start, current, anchor }) {
  // Adapted from https://github.com/oliviertassinari/react-swipeable-views/blob/7666de1dba253b896911adf2790ce51467670856/packages/react-swipeable-views/src/SwipeableViews.js#L175
  const axisProperties = {
    scrollPosition: {
      x: 'scrollLeft',
      y: 'scrollTop',
    },
    scrollLength: {
      x: 'scrollWidth',
      y: 'scrollHeight',
    },
    clientLength: {
      x: 'clientWidth',
      y: 'clientHeight',
    },
  };

  return domTreeShapes.some((shape) => {
    // Determine if we are going backward or forward.
    let goingForward = current >= start;
    if (anchor === 'top' || anchor === 'left') {
      goingForward = !goingForward;
    }
    const axis = anchor === 'left' || anchor === 'right' ? 'x' : 'y';
    const scrollPosition = Math.round(shape[axisProperties.scrollPosition[axis]]);

    const areNotAtStart = scrollPosition > 0;
    const areNotAtEnd =
      scrollPosition + shape[axisProperties.clientLength[axis]] <
      shape[axisProperties.scrollLength[axis]];

    if ((goingForward && areNotAtEnd) || (!goingForward && areNotAtStart)) {
      return true;
    }

    return false;
  });
}

const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
const transitionDurationDefault = { enter: duration.enteringScreen, exit: duration.leavingScreen };

/**
 *
 * Demos:
 *
 * - [Drawers](https://mui.com/components/drawers/)
 *
 * API:
 *
 * - [SwipeableDrawer API](https://mui.com/api/swipeable-drawer/)
 * - inherits [Drawer API](https://mui.com/api/drawer/)
 */
const SwipeableDrawer: React.JSXElementConstructor<SwipeableDrawerProps> = React.forwardRef(function SwipeableDrawer(inProps, ref) {
  const props = useThemeProps({ name: 'MuiSwipeableDrawer', props: inProps });
  const theme = useTheme();
  const {
    anchor = 'left',
    disableBackdropTransition = false,
    disableDiscovery = false,
    disableSwipeToOpen = iOS,
    hideBackdrop,
    hysteresis = 0.52,
    minFlingVelocity = 450,
    ModalProps: { BackdropProps, ...ModalPropsProp } = {},
    onClose,
    onOpen,
    open,
    PaperProps = {},
    SwipeAreaProps,
    swipeAreaWidth = 20,
    transitionDuration = transitionDurationDefault,
    variant = 'temporary', // Mobile first.
      onPercentOpenUpdate = undefined,
      onInnerDrawerOpenUpdate = undefined,
    ...other
  } = props;

  const [maybeSwiping, setMaybeSwiping] = React.useState(false);
  const swipeInstance = React.useRef({
    isSwiping: null,
  });

  const swipeAreaRef = React.useRef();
  const backdropRef = React.useRef();
  const paperRef = React.useRef();

  const touchDetected = React.useRef(false);

  // Ref for transition duration based on / to match swipe speed
  const calculatedDurationRef = React.useRef();

  // Use a ref so the open value used is always up to date inside useCallback.
  useEnhancedEffect(() => {
    calculatedDurationRef.current = null;
  }, [open]);

  const setPosition = React.useCallback(
    (translate, options = {}) => {
      const { mode = null, changeTransition = true } = options;

      const anchorRtl = getAnchor(theme, anchor);
      const rtlTranslateMultiplier = ['right', 'bottom'].indexOf(anchorRtl) !== -1 ? 1 : -1;
      const horizontalSwipe = isHorizontal(anchor);

      const transform = horizontalSwipe
        ? `translate(${rtlTranslateMultiplier * translate}px, 0)`
        : `translate(0, ${rtlTranslateMultiplier * translate}px)`;
      const drawerStyle = paperRef.current.style;
      drawerStyle.webkitTransform = transform;
      drawerStyle.transform = transform;

      let transition = '';

      if (mode) {
        transition = theme.transitions.create(
          'all',
          getTransitionProps(
            {
              easing: undefined,
              style: undefined,
              timeout: transitionDuration,
            },
            {
              mode,
            },
          ),
        );
      }

      if (changeTransition) {
        drawerStyle.webkitTransition = transition;
        drawerStyle.transition = transition;
      }

      if (!disableBackdropTransition && !hideBackdrop) {
        const backdropStyle = backdropRef.current.style;
        backdropStyle.opacity = 1 - translate / getMaxTranslate(horizontalSwipe, paperRef.current);
        if(onPercentOpenUpdate) {
          onPercentOpenUpdate(backdropStyle.opacity);
        }

        if (changeTransition) {
          backdropStyle.webkitTransition = transition;
          backdropStyle.transition = transition;
        }
      }
    },
    [anchor, disableBackdropTransition, hideBackdrop, theme, transitionDuration],
  );

  const handleBodyTouchEnd = useEventCallback((nativeEvent) => {
    if (!touchDetected.current) {
      return;
    }
    claimedSwipeInstance = null;
    touchDetected.current = false;
    setMaybeSwiping(false);

    // The swipe wasn't started.
    if (!swipeInstance.current.isSwiping) {
      swipeInstance.current.isSwiping = null;
      return;
    }

    swipeInstance.current.isSwiping = null;

    const anchorRtl = getAnchor(theme, anchor);
    const horizontal = isHorizontal(anchor);
    let current;
    if (horizontal) {
      current = calculateCurrentX(
        anchorRtl,
        nativeEvent.changedTouches,
        ownerDocument(nativeEvent.currentTarget),
      );
    } else {
      current = calculateCurrentY(
        anchorRtl,
        nativeEvent.changedTouches,
        ownerWindow(nativeEvent.currentTarget),
      );
    }

    const startLocation = horizontal ? swipeInstance.current.startX : swipeInstance.current.startY;
    const maxTranslate = getMaxTranslate(horizontal, paperRef.current);
    const currentTranslate = getTranslate(current, startLocation, open, maxTranslate);
    const translateRatio = currentTranslate / maxTranslate;

    if (Math.abs(swipeInstance.current.velocity) > minFlingVelocity) {
      // Calculate transition duration to match swipe speed
      calculatedDurationRef.current =
        Math.abs((maxTranslate - currentTranslate) / swipeInstance.current.velocity) * 1000;
    }

    if (open) {
      if (swipeInstance.current.velocity > minFlingVelocity || translateRatio > hysteresis) {
        onClose();
      } else {
        // Reset the position, the swipe was aborted.
        setPosition(0, {
          mode: 'exit',
        });
      }

      return;
    }

    if (swipeInstance.current.velocity < -minFlingVelocity || 1 - translateRatio > hysteresis) {
      onOpen();
    } else {
      // Reset the position, the swipe was aborted.
      setPosition(getMaxTranslate(horizontal, paperRef.current), {
        mode: 'enter',
      });
    }
  });

  const handleBodyTouchMove = useEventCallback((nativeEvent) => {
    // the ref may be null when a parent component updates while swiping
    if (!paperRef.current || !touchDetected.current) {
      return;
    }

    // We are not supposed to handle this touch move because the swipe was started in a scrollable container in the drawer
    if (claimedSwipeInstance !== null && claimedSwipeInstance !== swipeInstance.current) {
      return;
    }

    const anchorRtl = getAnchor(theme, anchor);
    const horizontalSwipe = isHorizontal(anchor);

    const currentX = calculateCurrentX(
      anchorRtl,
      nativeEvent.touches,
      ownerDocument(nativeEvent.currentTarget),
    );

    const currentY = calculateCurrentY(
      anchorRtl,
      nativeEvent.touches,
      ownerWindow(nativeEvent.currentTarget),
    );

    if (open && paperRef.current.contains(nativeEvent.target) && claimedSwipeInstance === null) {
      const domTreeShapes = getDomTreeShapes(nativeEvent.target, paperRef.current);
      const hasNativeHandler = computeHasNativeHandler({
        domTreeShapes,
        start: horizontalSwipe ? swipeInstance.current.startX : swipeInstance.current.startY,
        current: horizontalSwipe ? currentX : currentY,
        anchor,
      });

      if (hasNativeHandler) {
        claimedSwipeInstance = true;
        return;
      }
      claimedSwipeInstance = swipeInstance.current;
    }

    // We don't know yet.
    if (swipeInstance.current.isSwiping == null) {
      const dx = Math.abs(currentX - swipeInstance.current.startX);
      const dy = Math.abs(currentY - swipeInstance.current.startY);

      const definitelySwiping = horizontalSwipe
        ? dx > dy && dx > UNCERTAINTY_THRESHOLD
        : dy > dx && dy > UNCERTAINTY_THRESHOLD;

      if (definitelySwiping && nativeEvent.cancelable) {
        nativeEvent.preventDefault();
      }

      if (
        definitelySwiping === true ||
        (horizontalSwipe ? dy > UNCERTAINTY_THRESHOLD : dx > UNCERTAINTY_THRESHOLD)
      ) {
        swipeInstance.current.isSwiping = definitelySwiping;
        if (!definitelySwiping) {
          handleBodyTouchEnd(nativeEvent);
          return;
        }

        // Shift the starting point.
        swipeInstance.current.startX = currentX;
        swipeInstance.current.startY = currentY;

        // Compensate for the part of the drawer displayed on touch start.
        if (!disableDiscovery && !open) {
          if (horizontalSwipe) {
            swipeInstance.current.startX -= DRAG_STARTED_SIGNAL;
          } else {
            swipeInstance.current.startY -= DRAG_STARTED_SIGNAL;
          }
        }
      }
    }

    if (!swipeInstance.current.isSwiping) {
      return;
    }

    const maxTranslate = getMaxTranslate(horizontalSwipe, paperRef.current);
    let startLocation = horizontalSwipe
      ? swipeInstance.current.startX
      : swipeInstance.current.startY;
    if (open && !swipeInstance.current.paperHit) {
      startLocation = Math.min(startLocation, maxTranslate);
    }

    const translate = getTranslate(
      horizontalSwipe ? currentX : currentY,
      startLocation,
      open,
      maxTranslate,
    );

    if (open) {
      if (!swipeInstance.current.paperHit) {
        const paperHit = horizontalSwipe ? currentX < maxTranslate : currentY < maxTranslate;
        if (paperHit) {
          swipeInstance.current.paperHit = true;
          swipeInstance.current.startX = currentX;
          swipeInstance.current.startY = currentY;
        } else {
          return;
        }
      } else if (translate === 0) {
        swipeInstance.current.startX = currentX;
        swipeInstance.current.startY = currentY;
      }
    }

    if (swipeInstance.current.lastTranslate === null) {
      swipeInstance.current.lastTranslate = translate;
      swipeInstance.current.lastTime = performance.now() + 1;
    }

    const velocity =
      ((translate - swipeInstance.current.lastTranslate) /
        (performance.now() - swipeInstance.current.lastTime)) *
      1e3;

    // Low Pass filter.
    swipeInstance.current.velocity = swipeInstance.current.velocity * 0.4 + velocity * 0.6;

    swipeInstance.current.lastTranslate = translate;
    swipeInstance.current.lastTime = performance.now();

    // We are swiping, let's prevent the scroll event on iOS.
    if (nativeEvent.cancelable) {
      nativeEvent.preventDefault();
    }

    setPosition(translate);
  });

  const handleBodyTouchStart = useEventCallback((nativeEvent) => {
    // We are not supposed to handle this touch move.
    // Example of use case: ignore the event if there is a Slider.
    if (nativeEvent.defaultPrevented) {
      return;
    }

    // We can only have one node at the time claiming ownership for handling the swipe.
    if (nativeEvent.defaultMuiPrevented) {
      return;
    }

    // At least one element clogs the drawer interaction zone.
    if (
      open &&
      (hideBackdrop || !backdropRef.current.contains(nativeEvent.target)) &&
      !paperRef.current.contains(nativeEvent.target)
    ) {
      return;
    }

    const anchorRtl = getAnchor(theme, anchor);
    const horizontalSwipe = isHorizontal(anchor);

    const currentX = calculateCurrentX(
      anchorRtl,
      nativeEvent.touches,
      ownerDocument(nativeEvent.currentTarget),
    );

    const currentY = calculateCurrentY(
      anchorRtl,
      nativeEvent.touches,
      ownerWindow(nativeEvent.currentTarget),
    );

    if (!open) {
      if (disableSwipeToOpen || nativeEvent.target !== swipeAreaRef.current) {
        return;
      }
      if (horizontalSwipe) {
        if (currentX > swipeAreaWidth) {
          return;
        }
      } else if (currentY > swipeAreaWidth) {
        return;
      }
    }

    nativeEvent.defaultMuiPrevented = true;
    claimedSwipeInstance = null;
    swipeInstance.current.startX = currentX;
    swipeInstance.current.startY = currentY;

    setMaybeSwiping(true);
    if (!open && paperRef.current) {
      // The ref may be null when a parent component updates while swiping.
      setPosition(
        getMaxTranslate(horizontalSwipe, paperRef.current) +
          (disableDiscovery ? 15 : -DRAG_STARTED_SIGNAL),
        {
          changeTransition: false,
        },
      );
    }

    swipeInstance.current.velocity = 0;
    swipeInstance.current.lastTime = null;
    swipeInstance.current.lastTranslate = null;
    swipeInstance.current.paperHit = false;

    touchDetected.current = true;
  });

  React.useEffect(() => {
    if (variant === 'temporary') {
      const doc = ownerDocument(paperRef.current);
      doc.addEventListener('touchstart', handleBodyTouchStart);
      // A blocking listener prevents Firefox's navbar to auto-hide on scroll.
      // It only needs to prevent scrolling on the drawer's content when open.
      // When closed, the overlay prevents scrolling.
      doc.addEventListener('touchmove', handleBodyTouchMove, { passive: !open });
      doc.addEventListener('touchend', handleBodyTouchEnd);

      return () => {
        doc.removeEventListener('touchstart', handleBodyTouchStart);
        doc.removeEventListener('touchmove', handleBodyTouchMove, { passive: !open });
        doc.removeEventListener('touchend', handleBodyTouchEnd);
      };
    }

    return undefined;
  }, [variant, open, handleBodyTouchStart, handleBodyTouchMove, handleBodyTouchEnd]);

  React.useEffect(
    () => () => {
      // We need to release the lock.
      if (claimedSwipeInstance === swipeInstance.current) {
        claimedSwipeInstance = null;
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!open) {
      setMaybeSwiping(false);
    }
  }, [open]);

  const innerDrawerOpen = variant === 'temporary' && maybeSwiping ? true : open;

  React.useEffect(() => {
    if(onInnerDrawerOpenUpdate) {
      onInnerDrawerOpenUpdate(innerDrawerOpen);
    }
  }, [innerDrawerOpen]);

  console.log("maybeswiping", maybeSwiping);

  return (
    <React.Fragment>
      <Drawer
        open={innerDrawerOpen}
        variant={variant}
        ModalProps={{
          BackdropProps: {
            ...BackdropProps,
            ref: backdropRef,
          },
          ...ModalPropsProp,
        }}
        hideBackdrop={hideBackdrop}
        PaperProps={{
          ...PaperProps,
          style: {
            pointerEvents: variant === 'temporary' && !open ? 'none' : '',
            ...PaperProps.style,
          },
          ref: paperRef,
        }}
        anchor={anchor}
        transitionDuration={calculatedDurationRef.current || transitionDuration}
        onClose={onClose}
        ref={ref}
        {...other}
      />
      {!disableSwipeToOpen && variant === 'temporary' && (
        <NoSsr>
          <SwipeArea
            anchor={anchor}
            ref={swipeAreaRef}
            width={swipeAreaWidth}
            {...SwipeAreaProps}
          />
        </NoSsr>
      )}
    </React.Fragment>
  );
});

export default SwipeableDrawer;