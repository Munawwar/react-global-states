import { useState, useEffect } from 'react';
import 'es7-object-polyfill';

interface StoreMethods<Store> {
	useGlobalStates(propsToConnectTo: (keyof Store)[]): Partial<Store>;
	getStates(): Store;
	setStates(newStore: Store): void;
	updateStates(partial: Partial<Store>): void;
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
	const plainObjectPrototype = Object.getPrototypeOf({});
	const isPlainObject = (obj: unknown): boolean =>
		Boolean(
			obj
				&& typeof obj === 'object'
				&& Object.getPrototypeOf(obj) === plainObjectPrototype
		);
	// updateStates merges properties upto two levels of the data store
	const updateStates = (partial: Partial<Store>): void => {
		const newStore = { ...store };
		const propNames = Object.keys(partial);
		while (propNames.length) {
			const propName: string = propNames.shift() as string;
			const oldValue = store[propName];
			const newValue = partial[propName];
			if (isPlainObject(oldValue) && isPlainObject(newValue)) {
				newStore[propName] = {
					...oldValue,
					...newValue,
				};
			} else {
				newStore[propName] = newValue;
			}
		}
		store = newStore;
		pubsub.notify(newStore);
	};

	const setStates = (newStore: Store): void => {
		store = newStore;
		pubsub.notify(newStore);
	};

	// utility
	const twoLevelIsEqual = (
		oldState: Store,
		newState: Store,
		level = 1
	): boolean => {
		if (
			oldState === null
			|| newState === null
			|| oldState === undefined
			|| newState === undefined
		) {
			return oldState === newState;
		}

		const oldStatePrototype = Object.getPrototypeOf(oldState);
		if (
			level <= 2
			&& (oldStatePrototype === plainObjectPrototype || Array.isArray(oldState))
			&& oldStatePrototype === Object.getPrototypeOf(newState)
		) {
			// check if all props of oldState is in newState
			let isEqual = Object.entries(oldState).every(([key, val]) =>
				twoLevelIsEqual(val, newState[key], level + 1)
			);
			// check if all props of newState is in oldState
			isEqual =				isEqual
				&& Object.entries(newState).every(([key, val]) =>
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
		setStates,
		updateStates,
	};
};

const defaultStore = createStore({});

export const {
	useGlobalStates,
	getStates,
	setStates,
	updateStates,
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
