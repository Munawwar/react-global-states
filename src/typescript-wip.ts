import { useState, useEffect } from 'react';

interface Store<YourStoreInterface> {
  // SubPropPartial = <PartialYourStoreInterface, SubProp>>>
  useGlobalStates(propsToConnect: String[]): Partial<YourStoreInterface>,
  getStates() : Partial<YourStoreInterface>,
  updateStates(partial: Partial<YourStoreInterface>) : void,
  createSubPropUpdater<SubProp extends keyof YourStoreInterface>(prop: SubProp) : ((obj: Partial<Pick<YourStoreInterface, SubProp>>) => (Partial<Pick<YourStoreInterface, SubProp>>))
}

export const createStore = function createStore<YourStoreInterface>(initStore: Partial<YourStoreInterface> = {}): Store<YourStoreInterface> {
  // "The" global store
  let store: Partial<YourStoreInterface> = initStore;
  
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
  
  const getStates = () => {
    return { ...store };
  };
  
  // global state merger. unlike redux, I am not enforcing reducer layer
  const updateStates = (partial) => {
    const newStore = {
      ...store,
      ...partial,
    };
    store = newStore;
    pubsub.notify(newStore);
  };
  
  // curry function to partially update a sub property of global store.
  // e.g const updateCartState = createSubPropUpdater('cart');
  // updateCartState({ items: [], quantity: 0 });
  // this is equivalent to
  // updateStates({ cart: { ...store.cart, items: [], quantity: 0 } })
  const createSubPropUpdater = (propName) => {
    return (partial) => {
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
  };
  
  // utility
  const plainObjectPrototype = Object.getPrototypeOf({});
  const twoLevelIsEqual = (oldState, newState, level = 1) => {
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
      level <= 2
      && (oldStatePrototype === plainObjectPrototype || Array.isArray(oldState))
      && oldStatePrototype === Object.getPrototypeOf(newState)
    ) {
      // check if all props of oldState is in newState
      let isEqual = Object
        .entries(oldState)
        .every(([key, val]) => twoLevelIsEqual(val, newState[key], level + 1));
      // check if all props of newState is in oldState
      isEqual = isEqual && Object
        .entries(newState)
        .every(([key, val]) => twoLevelIsEqual(oldState[key], val, level + 1));
      // if so, they are equal (upto two levels).
      return isEqual;
    }
    if (oldState instanceof Date && newState instanceof Date) {
      return oldState.getTime() === newState.getTime();
    }
    return oldState === newState;
  };
  
  const useGlobalStates = (propsToConnectTo = []) => {
    let [
      state,
      setState,
    ] = useState(
      propsToConnectTo.reduce((acc, propName) => {
        if (propName in store) {
          acc[propName] = store[propName];
        }
        return acc;
      }, {}),
    ) as [Partial<YourStoreInterface>, Function];
  
    const propNameHash = propsToConnectTo.slice().sort().join('|');
    useEffect(() => {
      const newStateHandler = (newStore) => {
        const newState = propsToConnectTo.reduce((acc, propName) => {
          if (propName in newStore) {
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, propNameHash]);
  
    return state;
  };

  return {
    useGlobalStates,
    getStates,
    updateStates,
    createSubPropUpdater,
  } as Store<YourStoreInterface>;
}

const defaultStore = createStore({});

export const useGlobalStates = defaultStore.useGlobalStates;
export const getStates = defaultStore.getStates;
export const updateStates = defaultStore.updateStates;
export const createSubPropUpdater = defaultStore.createSubPropUpdater;


// -------------- app code testing ------------------

/*
  interface MyStoreType {
    greeting: string,
    cart: {
      totalQty: number
      items: {
        qty: number,
        sku: string,
      }[]
    }
  }

  const myStore = createStore<MyStoreType>({ greeting: 'hi', cart: { totalQty: 0, items: [] } });
  const updateCart = myStore.createSubPropUpdater('cart');
  updateCart({ greeting: 'hi '}); // error
  updateCart({ cart: [] }); // error
  updateCart({ cart: { totalQty: 0, items: [] } }); // no error
 */
