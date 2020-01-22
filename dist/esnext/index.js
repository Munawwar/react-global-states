import _extends from "@babel/runtime/helpers/extends";
import { useState, useEffect } from 'react'; // "The" global store

let store = {}; // internal publisher-subscriber system to
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
export const getStates = () => {
  return _extends({}, store);
}; // global state merger. unlike redux, I am not enforcing reducer layer

export const updateStates = partial => {
  const newStore = _extends({}, store, {}, partial);

  store = newStore;
  pubsub.notify(newStore);
}; // curry function to partially update a sub property of global store.
// e.g const updateCartState = createSubPropUpdater('cart');
// updateCartState({ items: [], quantity: 0 });
// this is equivalent to
// updateStates({ cart: { ...store.cart, items: [], quantity: 0 } })

export const createSubPropUpdater = propName => {
  return partial => {
    const newStore = _extends({}, store, {
      [propName]: _extends({}, store[propName] || {}, {}, partial)
    });

    store = newStore;
    pubsub.notify(newStore);
  };
}; // utility

const plainObjectPrototype = Object.getPrototypeOf({});

const twoLevelIsEqual = (oldState, newState, level = 1) => {
  if (oldState === null || newState === null || oldState === undefined || newState === undefined) {
    return oldState === newState;
  }

  const oldStatePrototype = Object.getPrototypeOf(oldState);

  if (level <= 2 && (oldStatePrototype === plainObjectPrototype || Array.isArray(oldState)) && oldStatePrototype === Object.getPrototypeOf(newState)) {
    // check if all props of oldState is in newState
    let isEqual = Object.entries(oldState).every(([key, val]) => twoLevelIsEqual(val, newState[key], level + 1)); // check if all props of newState is in oldState

    isEqual = isEqual && Object.entries(newState).every(([key, val]) => twoLevelIsEqual(oldState[key], val, level + 1)); // if so, they are equal (upto two levels).

    return isEqual;
  }

  if (oldState instanceof Date && newState instanceof Date) {
    return oldState.getTime() === newState.getTime();
  }

  return oldState === newState;
};

export const useGlobalStates = (propsToConnectTo = []) => {
  let [state, setState] = useState(propsToConnectTo.reduce((acc, propName) => {
    if (propName in store) {
      acc[propName] = store[propName];
    }

    return acc;
  }, {}));
  const propNameHash = propsToConnectTo.slice().sort().join('|');
  useEffect(() => {
    const newStateHandler = newStore => {
      const newState = propsToConnectTo.reduce((acc, propName) => {
        if (propName in newStore) {
          acc[propName] = newStore[propName];
        }

        return acc;
      }, {}); // console.log('current state', state);
      // console.log('new state', newState);
      // console.log('twoLevelIsEqual', twoLevelIsEqual(state, newState));

      if (!twoLevelIsEqual(state, newState)) {
        setState(newState);
      }
    };

    pubsub.subscribe(newStateHandler); // on component unmount, unsubscribe to prevent mem leak

    return () => pubsub.unsubscribe(newStateHandler); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, propNameHash]);
  return state;
};