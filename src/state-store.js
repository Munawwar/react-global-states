import React, { useState, useEffect } from 'react';

// "The" global store
let store = {};

// internal publisher-subscriber system to
// notify containers of store changes.
const pubsub = {
  handlers: [],
  subscribe(handler) {
    // console.log('subscribed');
    if (!this.handlers.includes(handler)) {
      this.handlers.push(handler);
    }
  },
  unsubscribe(handler) {
    // console.log('unsubscribed');
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  },
  notify(newStore) {
    this.handlers.forEach(handler => handler(newStore));
  }
};

// global state merger. unlike redux, I am not enforcing reducer layer
export const assignState = (partial) => {
  const newStore = {
    ...store,
    ...partial,
  };
  store = newStore;
  pubsub.notify(newStore);
};

export const setState = (newState) => {
  const newStore = { ...newState };
  store = newStore;
  pubsub.notify(newStore);
};

// utility
const twoLevelIsEqual = (oldState, newState, level = 1) => {
  if (level <= 2) {
    // check if all props of oldState is in newState
    let isEqual = Object.entries(oldState).every(([key, val]) => {
      if (level < 2 && typeof val === 'object' && val !== null) {
        return twoLevelIsEqual(val, newState[key], level + 1);
      }
      return (oldState[key] === newState[key]);
    });
    // check if all props of newState is in oldState
    isEqual = isEqual && Object.entries(newState).every(([key, val]) => {
      if (level < 2 && typeof val === 'object') {
        return twoLevelIsEqual(oldState[key], val, level + 1);
      }
      return (oldState[key] === newState[key]);
    });
    // if so, they are equal (upto two levels).
    return isEqual;
  }
  return oldState === newState;
}

// used to wrap components to receive global store props
export const connect = (propsToConnectTo = [], Component) => {
  return (props) => { // state container
    let [state, setState] = useState(
      propsToConnectTo.reduce((acc, propName) => {
        if (propName in store) {
          acc[propName] = store[propName];
        }
        return acc;
      }, {}),
    );

    useEffect(() => {
      const newStateHandler = (newStore) => {
        const newState = propsToConnectTo.reduce((acc, propName) => {
          if (propName in store) {
            acc[propName] = newStore[propName];
          }
          return acc;
        }, {});
        // console.log('current state', state);
        // console.log('new state', newState);
        // console.log('twoLevelIsEqual', twoLevelIsEqual(state, newState));
        if (!twoLevelIsEqual(state, newState)) {
          setState(newState);
        }
      };
      pubsub.subscribe(newStateHandler);
      // on component unmount, unsubscribe to prevent mem leak
      return () => pubsub.unsubscribe(newStateHandler);
    }, [state]);

    return <Component {...state} {...props} />;
  };
}