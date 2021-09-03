import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import 'es7-object-polyfill';

const plainObjectPrototype = Object.getPrototypeOf({});

export interface StoreMethods<Store> {
  getStates(): Store;
  setStates(newStore: Store): void;
  updateStates(partial: Partial<Store>): void;
  createPropUpdater<Prop extends keyof Store>(
    propName: Prop
  ): (partial: Partial<Store[Prop]>) => void;
  pubsub: {
    subscribe: (handler: (store: Store) => void) => void,
    unsubscribe: (handler: (store: Store) => void) => void,
  }
}

export const createStore = function createStore<Store>(
  initStore: Store
): StoreMethods<Store> {
  type StoreKey = keyof Store;
  type Handler = (store: Store) => void;

  // "The" global store
  let store = initStore;

  // internal publisher-subscriber system to
  // notify containers of store changes.
  const pubsub = {
    handlers: [] as Handler[],
    subscribe(handler: Handler): void {
      // console.log('subscribed');
      if (!this.handlers.includes(handler)) {
        this.handlers.push(handler);
      }
    },
    unsubscribe(handler: Handler): void {
      // console.log('unsubscribed');
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    },
    notify(newStore: Store): void {
      this.handlers.forEach((handler: Handler) => handler(newStore));
    },
  };

  const getStates = (): Store => ({ ...store });

  // global state merger. unlike redux, I am not enforcing reducer layer
  const isPlainObject = (obj: unknown): boolean =>
    Boolean(
      obj
        && typeof obj === 'object'
        && Object.getPrototypeOf(obj) === plainObjectPrototype
    );
  // updateStates merges properties upto two levels of the data store
  const updateStates = (partial: Partial<Store>): void => {
    const propNames = Object.keys(partial);
    while (propNames.length) {
      const propName: string = propNames.shift() as string;
      const oldValue = store[propName];
      const newValue = partial[propName];
      if (isPlainObject(oldValue) && isPlainObject(newValue)) {
        store[propName] = {
          ...oldValue,
          ...newValue,
        };
      } else {
        store[propName] = newValue;
      }
    }
    pubsub.notify(store);
  };

  const setStates = (newStore: Store): void => {
    store = newStore;
    pubsub.notify(newStore);
  };

  // curry function to partially update a sub property of global store.
  // e.g const updateCart = createPropUpdater('cart');
  // updateCart({ items: [], quantity: 0 });
  // this is equivalent to
  // updateStates({ cart: { items: [], quantity: 0 } })
  const createPropUpdater = <Prop extends StoreKey>(propName: Prop) =>
    (partial: Partial<Store[Prop]>): void =>
      updateStates({ [propName]: partial } as Partial<Store>);

  return {
    getStates,
    setStates,
    updateStates,
    createPropUpdater,
    pubsub,
  };
};

export interface Hooks<Store> {
  useGlobalState<Prop extends keyof Store>(propToSelect: Prop): Store[Prop],
  useStore(): StoreMethods<Store>,
  useUnwrappedAction<Action extends Function>(
    wrappedAction: (storeMethods: StoreMethods<Store>) => Action
  ): Action
}
export interface ContextAndHooks<Store> extends Hooks<Store> {
  Context: React.Context<StoreMethods<Store>>,
}

/**
 * Hooks can be created either for a client side only rendered app or server side rendered app
 * SSR apps includes CSR requirements (it's like a superset). CSR gives simpler APIs.
 * 
 * So for SRR, context is mandatory (and don't pass fixedStore)
 * For CSR, fixedStore is mandatory (and don't pass context)
 */
export function createHooks<Store>(
  fixedStore?: StoreMethods<Store>,
  context?: React.Context<StoreMethods<Store>|null>,
): Hooks<Store> {
  if (!context && !fixedStore) {
    throw new Error('Cannot use createHooks(). Please pass store or context.');
  }
  type StoreKey = keyof Store;

  // utility
  const isNullish = (val: unknown) => val === null || val === undefined;
  function isShallowEqual<Prop extends StoreKey>(
    oldState: Store[Prop],
    newState: Store[Prop],
  ): boolean {
    if (
      isNullish(oldState)
      || isNullish(newState)
      || typeof oldState !== 'object'
      || typeof newState !== 'object'
    ) {
      return oldState === newState;
    }

    const oldStatePrototype = Object.getPrototypeOf(oldState);
    if ((oldStatePrototype === plainObjectPrototype || Array.isArray(oldState))
      && oldStatePrototype === Object.getPrototypeOf(newState)
    ) {
      // check if all props of oldState is in newState
      let isEqual = Object.entries(oldState).every(([key, val]) => (
        val === newState[key]
      ));
      // check if all props of newState is in oldState
      isEqual = isEqual && Object.entries(newState).every(([key, val]) => (
        oldState[key] === val
      ));
      // if so, they are equal (upto two levels).
      return isEqual;
    }
    if (oldState instanceof Date && newState instanceof Date) {
      return oldState.getTime() === newState.getTime();
    }
    return oldState === newState;
  }

  function useGlobalState<Prop extends StoreKey>(
    propToSelect: Prop
  ): Store[Prop] {
    let storeMethods: StoreMethods<Store> | undefined;
    if (context) {
      storeMethods = useContext(context) || undefined;
      if (!storeMethods) {
        throw new Error('Cannot use hook. Please check if Provider has been added and that it has been initialized properly.');
      }
    } else {
      storeMethods = fixedStore;
      if (!storeMethods) {
        throw new Error('Cannot use hook. Please pass valid store.');
      }
    }
    const { getStates, pubsub } = storeMethods;
    const allStates = getStates();
    let [state, setState] = useState(allStates[propToSelect]);
    const [previousStore, setPreviousStore] = useState(storeMethods);

    // manage subscription
    useEffect(() => {
      // if store has changed then reset state from new store.
      if (storeMethods !== previousStore) {
        state = allStates[propToSelect];
        setState(state);
        setPreviousStore(storeMethods as StoreMethods<Store>);
      }

      const newStateHandler = (newStore: Store): void => {
        const newState = newStore[propToSelect];
        // console.log('current state', state);
        // console.log('new state', newState);
        // console.log('isShallowEqual', isShallowEqual(state, newState));
        if (!isShallowEqual(state, newState)) {
          setState(newState);
        }
      };
      pubsub.subscribe(newStateHandler);
      // unsubscribe on component unmount or store change
      return (): void => pubsub.unsubscribe(newStateHandler);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, storeMethods, propToSelect]);

    return state;
  }

  function useStore() {
    let storeMethods = fixedStore;
    if (context) {
      storeMethods = useContext(context) || undefined;
    }
    return storeMethods as unknown as StoreMethods<Store>;
  }

  function useUnwrappedAction<Action extends Function>(
    wrappedAction: (storeMethods: StoreMethods<Store>) => Action
  ) {
    let storeMethods;
    if (context) {
      storeMethods = useContext(context) || undefined;
      if (!storeMethods) {
        throw new Error('Cannot use hook. Please check if Provider has been added and that it has been initialized properly.');
      }
    } else {
      storeMethods = fixedStore;
      if (!storeMethods) {
        throw new Error('Cannot use hook. Please pass valid store.');
      }
    }
    return wrappedAction(storeMethods);
  }

  // function useUnwrappedActions<
  //   Action extends Function,
  //   WrappedActions extends {
  //     [name: string]: (storeMethods: StoreMethods<Store>) => Action
  //   }
  // >(
  //   wrappedActions: WrappedActions
  // ): {
  //   [ActionName in keyof WrappedActions]: ReturnType<WrappedActions[ActionName]>
  // } {
  //   const storeMethods = useContext(Context) as unknown as StoreMethods<Store>;
  //   const actions = Object.fromEntries(
  //     Object.entries(wrappedActions).map(([functionName, wrappedAction]) => [
  //       functionName,
  //       wrappedAction(storeMethods),
  //     ])
  //   );
  //   return actions as never;
  // }

  return {
    useGlobalState,
    useStore,
    useUnwrappedAction,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createContextAndHooks<Store>(_ignore?: Store): ContextAndHooks<Store> {
  const Context = createContext<StoreMethods<Store>|null>(null);

  const {
    useGlobalState,
    useStore,
    useUnwrappedAction,
  } = createHooks<Store>(undefined, Context);

  // were are making return value non-nullable, because null would throw error
  // with the hook. So once provider is properly initialized, it would contain Store.
  const ReturnContext = Context as React.Context<StoreMethods<Store>>;
  return {
    Context: ReturnContext,
    useGlobalState,
    useStore,
    useUnwrappedAction,
  };
}

// default store for client-side rendered applications
// these are easier to use than SSR compatible ones
export const store = createStore({});
export const { useGlobalState } = createHooks(store);
export const {
  getStates,
  setStates,
  updateStates,
  createPropUpdater,
} = store;

// -------------- app code testing ------------------
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
