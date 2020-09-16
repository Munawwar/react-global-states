import { renderHook } from '@testing-library/react-hooks';
import { createStore } from '.';

interface MyStore {
  user: {
    name: string;
  },
  cart: {
    quantity?: number,
    items?: string[]
  }
}

const {
	useGlobalStates,
	updateStates,
	getStates,
	createPropUpdater,
} = createStore<MyStore>({
	user: {
		name: 'me'
	},
	cart: {
		quantity: 1,
		items: ['Item 1'],
	}
});

// mock timer using jest
jest.useFakeTimers();

describe('react-global-states', () => {
	it('useGlobalStates gets the store props', () => {
		const { result } = renderHook(() => useGlobalStates(['cart']));
		expect(result.current.cart?.quantity).toBe(1);
	});

	it('updateStates merges level 2 props properly', () => {
		updateStates({ cart: { quantity: 2 } });

		const states = getStates();
		expect(states.cart?.quantity).toBe(2);
		expect(states.user?.name).toBe('me');
		expect(states.cart?.items).toEqual(['Item 1']);
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
