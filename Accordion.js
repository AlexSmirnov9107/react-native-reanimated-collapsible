import React, { useMemo, useReducer, useRef, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';

const {
  Value,
  block,
  startClock,
  Clock,
  cond,
  eq,
  timing,
  set,
  useCode,
  and,
  clockRunning,
  stopClock,
  debug,
} = Animated;

const reducer = (state, action) => {
  switch (action.type) {
    case 'initialize':
      return action.payload;
    default:
      state;
  }
};
function runTiming(clock, value, dest) {
  const state = {
    finished: new Value(0),
    position: value,
    time: new Value(0),
    frameTime: new Value(0),
  };

  const config = {
    duration: 1000,
    toValue: dest,
    easing: Easing.inOut(Easing.cubic),
  };

  return block([
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.position, value),
      set(state.frameTime, 0),
      set(config.toValue, dest),
      startClock(clock),
    ]),
    timing(clock, state, config),
    cond(state.finished, debug('stop clock', stopClock(clock))),
    state.position,
  ]);
}

const Accordion = (props) => {
  const {
    style,
    children,
    expand,
    initOpen = false,
    duration = 400,
    update,
  } = props;

  const [reducerState, dispatch] = useReducer(reducer, {
    height: new Value(0),
    done: false,
  });

  const { height, done } = reducerState;

  let { animatedHeight, initOpenDone } = useMemo(
    () => ({
      animatedHeight: new Value(0),
      initOpenDone: new Value(0),
    }),
    [],
  );

  const clock = new Clock();

  useCode(() => {
    const state = {
      position: animatedHeight,
      finished: new Value(0),
      time: new Value(0),
      frameTime: new Value(0),
    };
    const config = {
      toValue: height,
      duration,
      easing: Easing.linear,
    };

    return block([
      cond(and(eq(initOpen, 1), eq(initOpenDone, 0)), [
        set(animatedHeight, height),
        set(initOpenDone, 1),
      ]),
      cond(eq(expand, initOpen ? 0 : 1), [
        set(config.toValue, height),
        startClock(clock),
        timing(clock, state, config),
      ]),
      cond(eq(expand, initOpen ? 1 : 0), [
        set(config.toValue, 0),
        startClock(clock),
        timing(clock, state, config),
      ]),
    ]);
  }, [expand, done]);

  const viewRef = useRef();
  useEffect(() => {
    viewRef.current.measure((x, y, w, h, px, py) => {
      if (done && h) {
        height.setValue(h);
        animatedHeight.setValue(h);
        // Animated.timing(animatedHeight,{
        //   duration:100,
        //   toValue:h,
        //   easing:Easing.linear
        // }).start()
      }
    });
  }, [update]);
  return (
    <Animated.View
      onLayout={(e) => {
        if (e.nativeEvent.layout.height && !done) {
          dispatch({
            type: 'initialize',
            payload: {
              height: new Value(e.nativeEvent.layout.height),
              done: true,
            },
          });
        }
      }}
      style={[
        style,
        // eslint-disable-next-line react-native/no-inline-styles
        {
          overflow: 'hidden',
          height: initOpen && !done ? undefined : animatedHeight,
        },
      ]}>
      <View collapsable={false} ref={viewRef}>
        {children}
      </View>
    </Animated.View>
  );
};

export default Accordion;
