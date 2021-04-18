import { renderHook } from '@testing-library/react-hooks';
import { createStore, createContextAndHooks } from './index';
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

const initialState = {
	user: {
		name: 'me'
	},
	cart: {
		quantity: 1,
		items: ['Item 1'],
	}
};
export const {
	Context,
	useGlobalStates,
	useGlobalState,
	useStore,
} = createContextAndHooks<MyStore>();
const store = createStore<MyStore>(initialState);
const {
	updateStates,
	getStates,
	createPropUpdater,
} = store;

// mock timer using jest
jest.useFakeTimers();

describe('react-global-states', () => {
	it('useGlobalStates gets the store props', () => {
		const wrapper: React.FunctionComponent = ({ children }) => (
			<Context.Provider value={store}>{children}</Context.Provider>
		);
		const { result } = renderHook(() => useGlobalStates(['cart']), { wrapper });
		expect(result.current.cart?.quantity).toBe(1);
	});
	it('useGlobalState gets the store props', () => {
		const wrapper: React.FunctionComponent = ({ children }) => (
			<Context.Provider value={store}>{children}</Context.Provider>
		);
		const { result } = renderHook(() => useGlobalState('cart'), { wrapper });
		expect(result.current?.quantity).toBe(1);
	});

	it('updateStates merges level 2 props properly', () => {
		updateStates({ cart: { quantity: 2 } });

		const states = getStates();
		expect(states.cart?.quantity).toBe(2);
		expect(states.user?.name).toBe('me');
		expect(states.cart?.items).toEqual(['Item 1']);
	});

	it('useStore returns same store', () => {
		const wrapper: React.FunctionComponent = ({ children }) => (
			<Context.Provider value={store}>{children}</Context.Provider>
		);
		const { result } = renderHook(() => useStore(), { wrapper });
		expect(result.current).toEqual(store);
	});

	it('createPropUpdater merges the given props properly', () => {
		const updateCart = createPropUpdater('cart');
		updateCart({ quantity: 3 });

		const states = getStates();
		expect(states.cart?.quantity).toBe(3);
		expect(states.user?.name).toBe('me');
		expect(states.cart?.items).toEqual(['Item 1']);
	});
});
