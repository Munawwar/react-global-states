"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPropUpdater = exports.updateStates = exports.setStates = exports.getStates = exports.useGlobalState = exports.store = exports.createStore = void 0;
exports.createHooks = createHooks;
exports.createContextAndHooks = createContextAndHooks;
const react_1 = require("react");
const plainObjectPrototype = Object.getPrototypeOf({});
const createStore = function createStore(initStore) {
    // "The" global store
    let store = initStore;
    // Listeners for useSyncExternalStore
    const listeners = new Set();
    const getStates = () => ({ ...store });
    // global state merger. unlike redux, I am not enforcing reducer layer
    const isPlainObject = (obj) => Boolean(obj
        && typeof obj === 'object'
        && Object.getPrototypeOf(obj) === plainObjectPrototype);
    // Shallow equality check for plain objects and arrays
    const isShallowEqual = (a, b) => {
        if (Object.is(a, b)) {
            return true;
        }
        if (typeof a !== 'object' ||
            typeof b !== 'object' ||
            a === null ||
            b === null) {
            return false;
        }
        const aPrototype = Object.getPrototypeOf(a);
        const bPrototype = Object.getPrototypeOf(b);
        // Handle plain objects and arrays
        if ((aPrototype === plainObjectPrototype || Array.isArray(a)) &&
            aPrototype === bPrototype) {
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
    const notifyListeners = () => {
        listeners.forEach((listener) => listener());
    };
    // updateStates merges properties upto two levels of the data store
    const updateStates = (partial, isEqual = isShallowEqual) => {
        const propNames = Object.keys(partial);
        let hasChanges = false;
        while (propNames.length) {
            const propName = propNames.shift();
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
            }
            else {
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
    const setStates = (newStore) => {
        store = newStore;
        notifyListeners();
    };
    // Subscribe function compatible with useSyncExternalStore
    const subscribe = (callback) => {
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
    const createPropUpdater = (propName, isEqual) => (partial) => updateStates({ [propName]: partial }, isEqual);
    return {
        getStates,
        setStates,
        updateStates,
        createPropUpdater,
        subscribe,
    };
};
exports.createStore = createStore;
/**
 * Hooks can be created either for a client side only rendered app or server side rendered app
 * SSR apps includes CSR requirements (it's like a superset). CSR gives simpler APIs.
 *
 * So for SRR, context is mandatory (and don't pass fixedStore)
 * For CSR, fixedStore is mandatory (and don't pass context)
 */
function createHooks(fixedStore, context) {
    if (!context && !fixedStore) {
        throw new Error('Cannot use createHooks(). Please pass store or context.');
    }
    function useGlobalState(propToSelect) {
        let storeMethods;
        if (context) {
            storeMethods = (0, react_1.useContext)(context) || undefined;
            if (!storeMethods) {
                throw new Error('Cannot use hook. Please check if Provider has been added and that it has been initialized properly.');
            }
        }
        else {
            storeMethods = fixedStore;
            if (!storeMethods) {
                throw new Error('Cannot use hook. Please pass valid store.');
            }
        }
        const { getStates, subscribe } = storeMethods;
        // Create a getSnapshot function that returns the selected property
        const getSnapshot = () => {
            return getStates()[propToSelect];
        };
        // For SSR, provide a getServerSnapshot that returns the initial state
        const getServerSnapshot = () => {
            return getStates()[propToSelect];
        };
        // Use useSyncExternalStore for concurrent-safe state subscription
        const state = (0, react_1.useSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
        return state;
    }
    function useStore() {
        let storeMethods = fixedStore;
        if (context) {
            storeMethods = (0, react_1.useContext)(context) || undefined;
        }
        return storeMethods;
    }
    function useUnwrappedAction(wrappedAction) {
        let storeMethods;
        if (context) {
            storeMethods = (0, react_1.useContext)(context) || undefined;
            if (!storeMethods) {
                throw new Error('Cannot use hook. Please check if Provider has been added and that it has been initialized properly.');
            }
        }
        else {
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
function createContextAndHooks(_ignore) {
    const Context = (0, react_1.createContext)(null);
    const { useGlobalState, useStore, useUnwrappedAction, } = createHooks(undefined, Context);
    // were are making return value non-nullable, because null would throw error
    // with the hook. So once provider is properly initialized, it would contain Store.
    const ReturnContext = Context;
    return {
        Context: ReturnContext,
        useGlobalState,
        useStore,
        useUnwrappedAction,
    };
}
// default store for client-side rendered applications
// these are easier to use than SSR compatible ones
exports.store = (0, exports.createStore)({});
exports.useGlobalState = createHooks(exports.store).useGlobalState;
exports.getStates = exports.store.getStates, exports.setStates = exports.store.setStates, exports.updateStates = exports.store.updateStates, exports.createPropUpdater = exports.store.createPropUpdater;
//# sourceMappingURL=index.js.map