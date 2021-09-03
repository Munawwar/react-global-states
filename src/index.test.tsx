import { renderHook } from '@testing-library/react-hooks';
import {
	createStore,
	createContextAndHooks,
	useGlobalState as useGlobalStateCSRStore,
	getStates as getStatesCSRStore,
	setStates as setStatesCSRStore,
	updateStates as updateStatesCSRStore,
	createPropUpdater as createPropUpdaterCSRStore,
} from './index';
import React from 'react';

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

// mock timer using jest
jest.useFakeTimers();

describe('react-global-states', () => {
	it('CSR - useGlobalState gets the store props', () => {
		// @ts-ignore
		const { result } = renderHook(() => useGlobalStateCSRStore('cart'));
		// @ts-ignore
		expect(result.current?.quantity).toBe(1);
	});
	it('SSR - useGlobalState gets the store props', () => {
		const wrapper: React.FunctionComponent = ({ children }) => (
			<Context.Provider value={store}>{children}</Context.Provider>
		);
		const { result } = renderHook(() => useGlobalState('cart'), { wrapper });
		expect(result.current?.quantity).toBe(2);
	});

	it('CSR - updateStates merges level 2 props properly', () => {
		updateStatesCSRStore({ cart: { quantity: 3 } });

		const states = getStatesCSRStore();
		// @ts-ignore
		expect(states.cart?.quantity).toBe(3);
		// @ts-ignore
		expect(states.user?.name).toBe('me');
		// @ts-ignore
		expect(states.cart?.items).toEqual(['Item 1']);
	});
	it('SSR - updateStates merges level 2 props properly', () => {
		updateStates({ cart: { quantity: 4 } });

		const states = getStates();
		expect(states.cart?.quantity).toBe(4);
		expect(states.user?.name).toBe('him');
		expect(states.cart?.items).toEqual(['Item 2']);
	});

	it('SSR - useStore returns same store', () => {
		const wrapper: React.FunctionComponent = ({ children }) => (
			<Context.Provider value={store}>{children}</Context.Provider>
		);
		const { result } = renderHook(() => useStore(), { wrapper });
		expect(result.current).toEqual(store);
	});

	it('CSR - createPropUpdater merges the given props properly', () => {
		// @ts-ignore
		const updateCart = createPropUpdaterCSRStore('cart');
		// @ts-ignore
		updateCart({ quantity: 5 });

		const states = getStatesCSRStore();
		// @ts-ignore
		expect(states.cart?.quantity).toBe(5);
		// @ts-ignore
		expect(states.user?.name).toBe('me');
		// @ts-ignore
		expect(states.cart?.items).toEqual(['Item 1']);
	});
	it('SSR - createPropUpdater merges the given props properly', () => {
		const updateCart = createPropUpdater('cart');
		updateCart({ quantity: 6 });

		const states = getStates();
		expect(states.cart?.quantity).toBe(6);
		expect(states.user?.name).toBe('him');
		expect(states.cart?.items).toEqual(['Item 2']);
	});
});
