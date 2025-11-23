// @ts-nocheck
import test from 'ava';
import { renderHook } from '@testing-library/react';
import React from 'react';
import sinon from 'sinon';

import {
  createStore,
  createContextAndHooks,
  useGlobalState as useGlobalStateCSRStore,
  getStates as getStatesCSRStore,
  setStates as setStatesCSRStore,
  updateStates as updateStatesCSRStore,
  createPropUpdater as createPropUpdaterCSRStore,
} from './index.js';

interface MyStore {
  user: {
    name: string;
  },
  cart: {
    quantity?: number,
    items?: string[]
  }
}

setStatesCSRStore({
  user: {
    name: 'me'
  },
  cart: {
    quantity: 1,
    items: ['Item 1'],
  }
});

export const {
  Context,
  useGlobalState,
  useStore,
} = createContextAndHooks<MyStore>();

const store = createStore<MyStore>({
  user: {
    name: 'him'
  },
  cart: {
    quantity: 2,
    items: ['Item 2'],
  }
});

const {
  updateStates,
  getStates,
  createPropUpdater,
} = store;

test.before(() => {
  sinon.useFakeTimers();
});

test.after(() => {
  sinon.restore();
});

test('CSR - useGlobalState gets the store props', (t) => {
  const { result } = renderHook(() => useGlobalStateCSRStore('cart'));
  t.is(result.current?.quantity, 1);
});

test('SSR - useGlobalState gets the store props', (t) => {
  const wrapper: React.FunctionComponent = ({ children }) => (
    <Context.Provider value={store}>{children}</Context.Provider>
  );
  const { result } = renderHook(() => useGlobalState('cart'), { wrapper });
  t.is(result.current?.quantity, 2);
});

test('CSR - updateStates merges level 2 props properly', (t) => {
  updateStatesCSRStore({ cart: { quantity: 3 } });

  const states = getStatesCSRStore();
  t.is(states.cart?.quantity, 3);
  t.is(states.user?.name, 'me');
  t.deepEqual(states.cart?.items, ['Item 1']);
});

test('SSR - updateStates merges level 2 props properly', (t) => {
  updateStates({ cart: { quantity: 4 } });

  const states = getStates();
  t.is(states.cart?.quantity, 4);
  t.is(states.user?.name, 'him');
  t.deepEqual(states.cart?.items, ['Item 2']);
});

test('SSR - useStore returns same store', (t) => {
  const wrapper: React.FunctionComponent = ({ children }) => (
    <Context.Provider value={store}>{children}</Context.Provider>
  );
  const { result } = renderHook(() => useStore(), { wrapper });
  t.deepEqual(result.current, store);
});

test('CSR - createPropUpdater merges the given props properly', (t) => {
  const updateCart = createPropUpdaterCSRStore('cart');
  updateCart({ quantity: 5 });

  const states = getStatesCSRStore();
  t.is(states.cart?.quantity, 5);
  t.is(states.user?.name, 'me');
  t.deepEqual(states.cart?.items, ['Item 1']);
});

test('SSR - createPropUpdater merges the given props properly', (t) => {
  const updateCart = createPropUpdater('cart');
  updateCart({ quantity: 6 });

  const states = getStates();
  t.is(states.cart?.quantity, 6);
  t.is(states.user?.name, 'him');
  t.deepEqual(states.cart?.items, ['Item 2']);
});

test('CSR - updateStates with custom deep equality function', (t) => {
  // Deep equality function for nested comparisons
  const deepEqual = (a: unknown, b: unknown): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
  };
  
  const initialStates = getStatesCSRStore();
  const oldCart = initialStates.cart;
  
  // Update with same values - should NOT trigger change with deep equality
  updateStatesCSRStore({ cart: { quantity: oldCart?.quantity, items: oldCart?.items } }, deepEqual);
  
  const unchangedStates = getStatesCSRStore();
  // Should be the same reference because deep equality detected no change
  t.is(unchangedStates.cart, oldCart);
  
  // Now update with different value - should trigger change
  updateStatesCSRStore({ cart: { quantity: 999 } }, deepEqual);
  
  const newStates = getStatesCSRStore();
  t.is(newStates.cart?.quantity, 999);
  t.not(newStates.cart, oldCart);
});

test('SSR - updateStates with custom deep equality function', (t) => {
  // Deep equality function for nested comparisons
  const deepEqual = (a: unknown, b: unknown): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
  };
  
  const initialStates = getStates();
  const oldCart = initialStates.cart;
  
  // Update with same values - should NOT trigger change with deep equality
  updateStates({ cart: { quantity: oldCart?.quantity, items: oldCart?.items } }, deepEqual);
  
  const unchangedStates = getStates();
  // Should be the same reference because deep equality detected no change
  t.is(unchangedStates.cart, oldCart);
  
  // Now update with different nested structure
  updateStates({ cart: { items: ['New Item'] } }, deepEqual);
  
  const newStates = getStates();
  t.deepEqual(newStates.cart?.items, ['New Item']);
  t.not(newStates.cart, oldCart);
});
