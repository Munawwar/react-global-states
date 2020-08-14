import _extends from "@babel/runtime/helpers/extends";
import { useState, useEffect } from 'react';
export const createStore = function (initStore) {
  // "The" global store
  let store = initStore; // internal publisher-subscriber system to
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

  const getStates = () => _extends({}, store); // global state merger. unlike redux, I am not enforcing reducer layer


  const plainObjectPrototype = Object.getPrototypeOf({});

  const isPlainObject = obj => Boolean(obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === plainObjectPrototype); // updateStates merges properties upto two levels of the data store


  const updateStates = partial => {
    const newStore = _extends({}, store);

    const propNames = Object.keys(partial);

    while (propNames.length) {
      const propName = propNames.shift();
      const oldValue = store[propName];
      const newValue = partial[propName];

      if (isPlainObject(oldValue) && isPlainObject(newValue)) {
        newStore[propName] = _extends({}, oldValue, {}, newValue);
      } else {
        newStore[propName] = newValue;
      }
    }

    store = newStore;
    pubsub.notify(newStore);
  };

  // utility
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

  return {
    useGlobalStates: propsToConnectTo => {
      const [state, setState] = useState(propsToConnectTo.reduce((acc, propName) => {
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
    },
    getStates,
    setStates: newStore => {
      store = newStore;
      pubsub.notify(newStore);
    },
    updateStates
  };
};
const defaultStore = createStore({});
export const {
  useGlobalStates,
  getStates,
  setStates,
  updateStates
} = defaultStore; // -------------- app code testing ------------------

/*
interface MyStoreType {
	greeting: string;
	cart: {
		totalQty: number;
		items: {
			qty: number;
			sku: string;
		}[];
	};
	test: {
		test2: string;
	};
}
const { updateStates: updater } = createStore<MyStoreType>({
	greeting: 'hi',
	cart: { totalQty: 0, items: [] },
	test: { test2: 'hi' },
});
updater({ greeting: 'hi' }); // no error
updater({ cart: { greeting: 'hi' } }); // error
updater({ cart: { cart: {} } }); // error
updater({ cart: { test: {} } }); // error
updater({ cart: { test2: 'h1' } }); // error
updater({ cart: { totalQty: 0, items: [] } }); // no error
*/