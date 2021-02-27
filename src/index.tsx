import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import 'es7-object-polyfill';

const plainObjectPrototype = Object.getPrototypeOf({});

interface StoreMethods<Store> {
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
    const newStore = { ...store };
    const propNames = Object.keys(partial);
    while (propNames.length) {
      const propName: string = propNames.shift() as string;
      const oldValue = store[propName];
      const newValue = partial[propName];
      if (isPlainObject(oldValue) && isPlainObject(newValue)) {
        newStore[propName] = {
          ...oldValue,
          ...newValue,
        };
      } else {
        newStore[propName] = newValue;
      }
    }
    store = newStore;
    pubsub.notify(newStore);
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


// type ActionFunction = Function;
type AnyType = any;
type ActionCreatorsByNamespace<Store> = {
  [namespace: string]: {
    [functionName: string]: (storeMethods: StoreMethods<Store>) => AnyType
  }
}
interface ContextAndDependents<Store> {
  Context: React.Context<StoreMethods<Store>>,
  useGlobalStates(propsToConnectTo: (keyof Store)[]): Partial<Store>,
  bindActionCreators: <Props>(
    Component: React.ComponentType<Props>,
    actionCreatorsByNamespace: ActionCreatorsByNamespace<Store>
  ) => React.FunctionComponent<Props>,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createContextAndDependents<Store>(_ignore?: Store): ContextAndDependents<Store> {
  type StoreKey = keyof Store;

  const Context = createContext<StoreMethods<Store>|null>(null);

  // utility
  function twoLevelIsEqual(
    oldState: Store,
    newState: Store,
    level = 1
  ): boolean {
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
      let isEqual = Object.entries(oldState).every(([key, val]) =>
        twoLevelIsEqual(val, newState[key], level + 1)
      );
      // check if all props of newState is in oldState
      isEqual =        isEqual
        && Object.entries(newState).every(([key, val]) =>
          twoLevelIsEqual(oldState[key], val, level + 1)
        );
      // if so, they are equal (upto two levels).
      return isEqual;
    }
    if (oldState instanceof Date && newState instanceof Date) {
      return oldState.getTime() === newState.getTime();
    }
    return oldState === newState;
  }

  function useGlobalStates(
    propsToConnectTo: StoreKey[]
  ): Partial<Store> {
    const ret = useContext(Context);
    if (!ret) {
      throw new Error('Cannot use hook. Please check if Provider has been added and that it has been initialized properly.');
    }
    const { getStates, pubsub } = ret;
    const store = getStates();
    const [state, setState] = useState(
      propsToConnectTo.reduce((acc, propName) => {
        if (propName in store) {
          acc[propName] = store[propName];
        }
        return acc;
      }, {} as Store)
    );

    const propNameHash = propsToConnectTo
      .slice()
      .sort()
      .join('|');
    useEffect(() => {
      const newStateHandler = (newStore: Store): void => {
        const newState = propsToConnectTo.reduce((acc, propName) => {
          if (propName in newStore) {
            acc[propName] = newStore[propName];
          }
          return acc;
        }, {} as Store);
        // console.log('current state', state);
        // console.log('new state', newState);
        // console.log('twoLevelIsEqual', twoLevelIsEqual(state, newState));
        if (!twoLevelIsEqual(state, newState)) {
          setState(newState);
        }
      };
      pubsub.subscribe(newStateHandler);
      // on component unmount, unsubscribe to prevent mem leak
      return (): void => pubsub.unsubscribe(newStateHandler);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, propNameHash]);

    return state;
  }

  function bindActionCreators<Props>(
    Component: React.ComponentType<Props>,
    actionCreatorsByNamespace: ActionCreatorsByNamespace<Store>
  ) {
    return function ComponentWrapper(props: Props) {
      const storeMethods = useContext(Context);
      const propsToInject = Object
        .entries(actionCreatorsByNamespace)
        .reduce((props, [namespace, actionCreators]) => {
          props[namespace] = Object
            .entries(actionCreators)
            .reduce((actions, [functionName, actionCreator]) => {
              actions[functionName] = actionCreator(storeMethods as StoreMethods<Store>);
              return actions;
            }, {});
          return props;
        }, {});
      return <Component {...props} {...propsToInject} />;
    } as React.FunctionComponent;
  }

  // were are making return value non-nullable, because null would throw error
  // with the hook. So once provider is properly initialized, it would contain Store.
  const ReturnContext = Context as React.Context<StoreMethods<Store>>;
  return {
    Context: ReturnContext,
    useGlobalStates,
    bindActionCreators,
  };
}

// default store
export const { Context, useGlobalStates } = createContextAndDependents<{}>();
export const store = createStore({});
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
