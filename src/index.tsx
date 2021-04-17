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
    // FIXME: causes entire app refresh, due to react context
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


// type UnboundedActionsByNamespace<Store> = {
//   [namespace: string]: {
//     [functionName: string]: (storeMethods: StoreMethods<Store>) => Function
//   }
// }
// type BoundedActionsByNamespace<
//   Store,
//   ns extends keyof UnboundedActionsByNamespace<Store>
// > = {
//   [namespace: ns]: {
//     [functionName: string]: (storeMethods: StoreMethods<Store>) => Function
//   }
// }
export interface ContextAndDependents<Store> {
  Context: React.Context<StoreMethods<Store>>,
  /**
   * This function is deprecated because people forget to remove unnecessary dependencies.
   * Use useGlobalState() (singular) instead.
   * @deprecated
   */
  useGlobalStates(propsToSelect: (keyof Store)[]): Partial<Store>,
  useGlobalState<Prop extends keyof Store>(propToSelect: Prop): Store[Prop],
  connect: <
    Props,
    UnboundedActionsByNamespace extends {
      [namespace: string]: {
        [functionName: string]: (storeMethods: StoreMethods<Store>) => Function
      }
    },


    NamespaceKey extends keyof UnboundedActionsByNamespace,
    NamespaceProps extends UnboundedActionsByNamespace[NamespaceKey],
    FunctionName extends keyof NamespaceProps,
    ActionCreator extends NamespaceProps[FunctionName],
    Action extends ReturnType<ActionCreator>,
    BoundedActionsByNamespace extends {
      [namespace in NamespaceKey]: {
        [functionName in FunctionName]: Action
      }
    }
  >(
    Component: React.ComponentType<Props>,
    unboundedActionsByNamespace?: UnboundedActionsByNamespace
  ) => React.FunctionComponent<Props | BoundedActionsByNamespace>,
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
    propsToSelect: StoreKey[]
  ): Partial<Store> {
    const ret = useContext(Context);
    if (!ret) {
      throw new Error('Cannot use hook. Please check if Provider has been added and that it has been initialized properly.');
    }
    const { getStates, pubsub } = ret;
    const store = getStates();
    const [state, setState] = useState(
      propsToSelect.reduce((acc, propName) => {
        if (propName in store) {
          acc[propName] = store[propName];
        }
        return acc;
      }, {} as Store)
    );

    const propNameHash = propsToSelect
      .slice()
      .sort()
      .join('|');
    useEffect(() => {
      const newStateHandler = (newStore: Store): void => {
        const newState = propsToSelect.reduce((acc, propName) => {
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

  function useGlobalState<Prop extends keyof Store>(
    propToSelect: Prop
  ): Store[Prop] {
    const props = useGlobalStates([propToSelect]);
    return props[propToSelect] as Store[Prop];
  }

  function connect<
    Props,
    UnboundedActionsByNamespace extends {
      [namespace: string]: {
        [functionName: string]: (storeMethods: StoreMethods<Store>) => Function
      }
    },


    NamespaceKey extends keyof UnboundedActionsByNamespace,
    NamespaceProps extends UnboundedActionsByNamespace[NamespaceKey],
    FunctionName extends keyof NamespaceProps,
    ActionCreator extends NamespaceProps[FunctionName],
    Action extends ReturnType<ActionCreator>,
    BoundedActionsByNamespace extends {
      [namespace in NamespaceKey]: {
        [functionName in FunctionName]: Action
      }
    }
  >(
    Component: React.ComponentType<Props>,
    unboundedActionsByNamespace?: UnboundedActionsByNamespace
  ) {
    return function ComponentWrapper(props: Props) {
      const storeMethods = useContext(Context) as unknown as StoreMethods<Store>;
      const propsToInject = Object
        .entries(unboundedActionsByNamespace || {})
        .reduce((props, [namespace, actionCreators]) => {
          props[namespace] = Object
            .entries(actionCreators)
            .reduce((actions, [functionName, actionCreator]) => {
              const actionFunc = actionCreator(storeMethods);
              actions[functionName] = actionFunc;
              return actions;
            }, {} as { [functionName in FunctionName]: Action });
          return props;
        }, {} as BoundedActionsByNamespace);
      return <Component {...props} {...propsToInject} store={storeMethods} />;
    } as React.FunctionComponent<Props | BoundedActionsByNamespace>;
  }

  // were are making return value non-nullable, because null would throw error
  // with the hook. So once provider is properly initialized, it would contain Store.
  const ReturnContext = Context as React.Context<StoreMethods<Store>>;
  return {
    Context: ReturnContext,
    useGlobalStates,
    useGlobalState,
    // @ts-ignore
    connect,
  };
}

// default store
export const { Context, useGlobalStates, useGlobalState } = createContextAndDependents<{}>();
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
