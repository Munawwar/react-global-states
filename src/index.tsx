import React, {
  createContext,
  useContext,
  useSyncExternalStore,
} from 'react';

const plainObjectPrototype = Object.getPrototypeOf({});

export type EqualityFn = (a: unknown, b: unknown) => boolean;

export interface StoreMethods<Store> {
  getStates(): Store;
  setStates(newStore: Store): void;
  updateStates(partial: Partial<Store>, isEqual?: EqualityFn): void;
  createPropUpdater<Prop extends keyof Store>(
    propName: Prop,
    isEqual?: EqualityFn
  ): (partial: Partial<Store[Prop]>) => void;
  subscribe(callback: () => void): () => void;
}

export const createStore = function createStore<Store>(
  initStore: Store
): StoreMethods<Store> {
  type StoreKey = keyof Store;
  type Listener = () => void;

  // "The" global store
  let store = initStore;

  // Listeners for useSyncExternalStore
  const listeners = new Set<Listener>();

  const getStates = (): Store => ({ ...store });

  // global state merger. unlike redux, I am not enforcing reducer layer
  const isPlainObject = (obj: unknown): boolean =>
    Boolean(
      obj
        && typeof obj === 'object'
        && Object.getPrototypeOf(obj) === plainObjectPrototype
    );

  // Shallow equality check for plain objects and arrays
  const isShallowEqual = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) {
      return true;
    }

    if (
      typeof a !== 'object' ||
      typeof b !== 'object' ||
      a === null ||
      b === null
    ) {
      return false;
    }

    const aPrototype = Object.getPrototypeOf(a);
    const bPrototype = Object.getPrototypeOf(b);

    // Handle plain objects and arrays
    if (
      (aPrototype === plainObjectPrototype || Array.isArray(a)) &&
      aPrototype === bPrototype
    ) {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);

      if (aKeys.length !== bKeys.length) {
        return false;
      }

      return aKeys.every(key => Object.is(a[key], b[key]));
    }

    // Handle Date objects
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    return false;
  };

  // Notify all listeners
  const notifyListeners = (): void => {
    listeners.forEach((listener) => listener());
  };

  // updateStates merges properties upto two levels of the data store
  const updateStates = (
    partial: Partial<Store>,
    isEqual: EqualityFn = isShallowEqual
  ): void => {
    const propNames = Object.keys(partial);
    let hasChanges = false;

    while (propNames.length) {
      const propName: string = propNames.shift() as string;
      const oldValue = store[propName];
      const newValue = partial[propName];

      if (isPlainObject(oldValue) && isPlainObject(newValue)) {
        // Merge the objects
        const mergedValue = {
          ...oldValue,
          ...newValue,
        };
        
        // Only update if the merged result is different from the old value
        if (!isEqual(oldValue, mergedValue)) {
          store[propName] = mergedValue;
          hasChanges = true;
        }
      } else {
        // For non-plain-objects, check if the value actually changed
        if (!isEqual(oldValue, newValue)) {
          store[propName] = newValue;
          hasChanges = true;
        }
      }
    }

    // Only notify listeners if something actually changed
    if (hasChanges) {
      notifyListeners();
    }
  };

  const setStates = (newStore: Store): void => {
    store = newStore;
    notifyListeners();
  };

  // Subscribe function compatible with useSyncExternalStore
  const subscribe = (callback: Listener): (() => void) => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  };

  // curry function to partially update a sub property of global store.
  // e.g const updateCart = createPropUpdater('cart');
  // updateCart({ items: [], quantity: 0 });
  // this is equivalent to
  // updateStates({ cart: { items: [], quantity: 0 } })
  const createPropUpdater = <Prop extends StoreKey>(
    propName: Prop,
    isEqual?: EqualityFn
  ) =>
    (partial: Partial<Store[Prop]>): void =>
      updateStates({ [propName]: partial } as Partial<Store>, isEqual);

  return {
    getStates,
    setStates,
    updateStates,
    createPropUpdater,
    subscribe,
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
    
    const { getStates, subscribe } = storeMethods;

    // Create a getSnapshot function that returns the selected property
    const getSnapshot = (): Store[Prop] => {
      return getStates()[propToSelect];
    };

    // For SSR, provide a getServerSnapshot that returns the initial state
    const getServerSnapshot = (): Store[Prop] => {
      return getStates()[propToSelect];
    };

    // Use useSyncExternalStore for concurrent-safe state subscription
    const state = useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot
    );

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

