import React from 'react';
import 'es7-object-polyfill';
export interface StoreMethods<Store> {
    getStates(): Store;
    setStates(newStore: Store): void;
    updateStates(partial: Partial<Store>): void;
    createPropUpdater<Prop extends keyof Store>(propName: Prop): (partial: Partial<Store[Prop]>) => void;
    pubsub: {
        subscribe: (handler: (store: Store) => void) => void;
        unsubscribe: (handler: (store: Store) => void) => void;
    };
}
export declare const createStore: <Store>(initStore: Store) => StoreMethods<Store>;
export interface Hooks<Store> {
    useGlobalState<Prop extends keyof Store>(propToSelect: Prop): Store[Prop];
    useStore(): StoreMethods<Store>;
    useUnwrappedAction<Action extends Function>(wrappedAction: (storeMethods: StoreMethods<Store>) => Action): Action;
}
export interface ContextAndHooks<Store> extends Hooks<Store> {
    Context: React.Context<StoreMethods<Store>>;
}
/**
 * Hooks can be created either for a client side only rendered app or server side rendered app
 * SSR apps includes CSR requirements (it's like a superset). CSR gives simpler APIs.
 *
 * So for SRR, context is mandatory (and don't pass fixedStore)
 * For CSR, fixedStore is mandatory (and don't pass context)
 */
export declare function createHooks<Store>(fixedStore?: StoreMethods<Store>, context?: React.Context<StoreMethods<Store> | null>): Hooks<Store>;
export declare function createContextAndHooks<Store>(_ignore?: Store): ContextAndHooks<Store>;
export declare const store: StoreMethods<{}>;
export declare const useGlobalState: <Prop extends never>(propToSelect: Prop) => {}[Prop];
export declare const getStates: () => {}, setStates: (newStore: {}) => void, updateStates: (partial: Partial<{}>) => void, createPropUpdater: <Prop extends never>(propName: Prop) => (partial: Partial<{}[Prop]>) => void;
