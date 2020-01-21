import { useState, useEffect } from 'react';

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

export const getState = (propName) => {
  return store[propName];
};

// curry function to partially update a sub property of global store.
// e.g const updateCartState = getStateUpdater('cart');
// updateCartState({ items: [], quantity: 0 });
// this is equivalent to
// setStates({ cart: { ...store.cart, items: [], quantity: 0 } })
const cache = {};
export const getStateUpdater = (propName) => {
  if (!cache[propName]) {
    cache[propName] = (partial) => {
      const newStore = {
        ...store,
        [propName]: {
          ...(store[propName] || {}),
          ...partial,
        }
      };
      store = newStore;
      pubsub.notify(newStore);
    };
  }
  return cache[propName];
};

// utility
const plainObjectPrototype = Object.getPrototypeOf({});
const isShallowEqual = (oldState, newState, level = 1) => {
  if (
    oldState === null
    || newState === null
    || oldState === undefined
    || newState === undefined
  ) {
    return oldState === newState;
  }

  const oldStatePrototype = Object.getPrototypeOf(oldState);
  if (
    level === 1
    && (oldStatePrototype === plainObjectPrototype || Array.isArray(oldState))
    && oldStatePrototype === Object.getPrototypeOf(newState)
  ) {
    return (
      // check if all props of oldState is in newState
      Object
        .entries(oldState)
        .every(([key, val]) => isShallowEqual(val, newState[key], level + 1))
      // check if all props of newState is in oldState
      &&
      Object
        .entries(newState)
        .every(([key, val]) => isShallowEqual(oldState[key], val, level + 1))
    );
    // if so, they are equal (upto two levels).
  }
  if (oldState instanceof Date && newState instanceof Date) {
    return oldState.getTime() === newState.getTime();
  }
  return oldState === newState;
};

export const useGlobalState = (propName) => {
  let [state, setState] = useState(
    propName in store ? store[propName] : {},
  );

  useEffect(() => {
    const newStateHandler = (newStore) => {
      const newState = newStore[propName];
      // console.log('current state', state);
      // console.log('new state', newState);
      // console.log('isShallowEqual', isShallowEqual(state, newState));
      if (!isShallowEqual(state, newState)) {
        setState(newState);
      }
    };
    pubsub.subscribe(newStateHandler);
    // on component unmount, unsubscribe to prevent mem leak
    return () => pubsub.unsubscribe(newStateHandler);
  }, [state]);

  return state;
};
