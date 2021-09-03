import { useMemo } from "react";
import { createStore, createContextAndHooks } from "react-global-states";
import createId from "./createId";

let store;

export const initialState = {
  lastUpdate: 0,
  light: false,
  count: 0,
  storeId: 0
};

function initStore(preloadedState = initialState) {
  return createStore({
    ...preloadedState,
    storeId: createId()
  });
}

export const initializeStore = (preloadedState) => {
  let _store = store ?? initStore(preloadedState);

  // After navigating to a page with an initial Redux state, merge that state
  // with the current state in the store, and create a new store
  if (preloadedState && store) {
    _store = initStore({
      ...store.getStates(),
      ...preloadedState
    });
    // Reset the current store
    store = undefined;
  }

  // For SSG and SSR always create a new store
  if (typeof window === "undefined") return _store;
  // Create the store once in the client
  if (!store) store = _store;

  return _store;
};

export function useMemoizedStore(initialState) {
  const store = useMemo(() => initializeStore(initialState), [initialState]);
  return store;
}

export const { Context, useGlobalState, useStore } = createContextAndHooks(
  initialState
);
