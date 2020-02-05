import { useState, useEffect } from 'react';

interface StoreMethods<Store> {
	useGlobalStates(propsToConnectTo: (keyof Store)[]): Partial<Store>;
	getStates(): Store;
	updateStates(partial: Store): void;
	createSubPropUpdater<Prop extends keyof Store>(
		propName: Prop
	): (partial: Partial<Store[Prop]>) => void;
}

export const createStore = function createStore<YourStoreInterface>(
	initStore: YourStoreInterface
): StoreMethods<YourStoreInterface> {
	type Store = YourStoreInterface;
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

	const getStates = (): YourStoreInterface => ({ ...store });

	// global state merger. unlike redux, I am not enforcing reducer layer
	const updateStates = (partial: Store): void => {
		const newStore = {
			...store,
			...partial,
		};
		store = newStore;
		pubsub.notify(newStore);
	};

	// curry function to partially update a sub property of global store.
	// e.g const updateCartState = createSubPropUpdater('cart');
	// updateCartState({ items: [], quantity: 0 });
	// this is equivalent to
	// updateStates({ cart: { ...store.cart, items: [], quantity: 0 } })
	const createSubPropUpdater = <Prop extends StoreKey>(propName: Prop) => (
		partial: Partial<Store[Prop]>
	): void => {
		const newStore = {
			...store,
			[propName]: {
				...(store[propName] || {}),
				...partial,
			},
		};
		store = newStore;
		pubsub.notify(newStore);
	};

	// utility
	const plainObjectPrototype = Object.getPrototypeOf({});
	const twoLevelIsEqual = (
		oldState: Store,
		newState: Store,
		level = 1
	): boolean => {
		if (
			oldState === null ||
			newState === null ||
			oldState === undefined ||
			newState === undefined
		) {
			return oldState === newState;
		}

		const oldStatePrototype = Object.getPrototypeOf(oldState);
		if (
			level <= 2 &&
			(oldStatePrototype === plainObjectPrototype || Array.isArray(oldState)) &&
			oldStatePrototype === Object.getPrototypeOf(newState)
		) {
			// check if all props of oldState is in newState
			let isEqual = Object.entries(oldState).every(([key, val]) =>
				twoLevelIsEqual(val, newState[key], level + 1)
			);
			// check if all props of newState is in oldState
			isEqual =
				isEqual &&
				Object.entries(newState).every(([key, val]) =>
					twoLevelIsEqual(oldState[key], val, level + 1)
				);
			// if so, they are equal (upto two levels).
			return isEqual;
		}
		if (oldState instanceof Date && newState instanceof Date) {
			return oldState.getTime() === newState.getTime();
		}
		return oldState === newState;
	};

	const useGlobalStates = (
		propsToConnectTo: StoreKey[]
	): Partial<YourStoreInterface> => {
		const [state, setState] = useState(
			propsToConnectTo.reduce((acc, propName) => {
				if (propName in store) {
					acc[propName] = store[propName];
				}
				return acc;
			}, {} as Store)
		);

		const propNameHash = propsToConnectTo
			.slice()
			.sort()
			.join('|');
		useEffect(() => {
			const newStateHandler = (newStore: Store): void => {
				const newState = propsToConnectTo.reduce((acc, propName) => {
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
	};

	return {
		useGlobalStates,
		getStates,
		updateStates,
		createSubPropUpdater,
	};
};

const defaultStore = createStore({});

export const {
	useGlobalStates,
	getStates,
	updateStates,
	createSubPropUpdater,
} = defaultStore;

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
const myStore = createStore<MyStoreType>({
	greeting: 'hi',
	cart: { totalQty: 0, items: [] },
	test: { test2: 'hi' },
});
const updateCart = myStore.createSubPropUpdater('cart');
updateCart({ greeting: 'hi' }); // error
updateCart({ cart: {} }); // error
updateCart({ test: {} }); // error
updateCart({ test2: 'h1' }); // error
updateCart({ totalQty: 0, items: [] }); // no error
*/
