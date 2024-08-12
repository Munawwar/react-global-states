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
            this.handlers.forEach((handler) => handler(newStore));
        },
    };
    const getStates = () => ({ ...store });
    // global state merger. unlike redux, I am not enforcing reducer layer
    const isPlainObject = (obj) => Boolean(obj
        && typeof obj === 'object'
        && Object.getPrototypeOf(obj) === plainObjectPrototype);
    // updateStates merges properties upto two levels of the data store
    const updateStates = (partial) => {
        const propNames = Object.keys(partial);
        while (propNames.length) {
            const propName = propNames.shift();
            const oldValue = store[propName];
            const newValue = partial[propName];
            if (isPlainObject(oldValue) && isPlainObject(newValue)) {
                store[propName] = {
                    ...oldValue,
                    ...newValue,
                };
            }
            else {
                store[propName] = newValue;
            }
        }
        pubsub.notify(store);
    };
    const setStates = (newStore) => {
        store = newStore;
        pubsub.notify(newStore);
    };
    // curry function to partially update a sub property of global store.
    // e.g const updateCart = createPropUpdater('cart');
    // updateCart({ items: [], quantity: 0 });
    // this is equivalent to
    // updateStates({ cart: { items: [], quantity: 0 } })
    const createPropUpdater = (propName) => (partial) => updateStates({ [propName]: partial });
    return {
        getStates,
        setStates,
        updateStates,
        createPropUpdater,
        pubsub,
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
    // utility
    const isNullish = (val) => val === null || val === undefined;
    function isShallowEqual(oldState, newState) {
        if (isNullish(oldState)
            || isNullish(newState)
            || typeof oldState !== 'object'
            || typeof newState !== 'object') {
            return oldState === newState;
        }
        const oldStatePrototype = Object.getPrototypeOf(oldState);
        if ((oldStatePrototype === plainObjectPrototype || Array.isArray(oldState))
            && oldStatePrototype === Object.getPrototypeOf(newState)) {
            // check if all props of oldState is in newState
            let isEqual = Object.entries(oldState).every(([key, val]) => (val === newState[key]));
            // check if all props of newState is in oldState
            isEqual = isEqual && Object.entries(newState).every(([key, val]) => (oldState[key] === val));
            // if so, they are equal (upto two levels).
            return isEqual;
        }
        if (oldState instanceof Date && newState instanceof Date) {
            return oldState.getTime() === newState.getTime();
        }
        return oldState === newState;
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
        const { getStates, pubsub } = storeMethods;
        const allStates = getStates();
        let [state, setState] = (0, react_1.useState)(allStates[propToSelect]);
        const [previousStore, setPreviousStore] = (0, react_1.useState)(storeMethods);
        // manage subscription
        (0, react_1.useEffect)(() => {
            // if store has changed then reset state from new store.
            if (storeMethods !== previousStore) {
                state = allStates[propToSelect];
                setState(state);
                setPreviousStore(storeMethods);
            }
            const newStateHandler = (newStore) => {
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
            return () => pubsub.unsubscribe(newStateHandler);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [state, storeMethods, propToSelect]);
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
//# sourceMappingURL=index.js.map