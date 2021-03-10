import React from 'react';
import { createStore } from 'react-global-states';
import { Context, getInitialState } from './storeHelpers';
import StateTest from './StateTest';

function App() {
	// For SSR, creating a new store for every request and injecting it to rest of
	// the app (via Provider) is best practice.
	// For CSR, this is done only once.. so this code is compatible with both.
	const storeMethods = createStore(getInitialState());
	const { getStates, createPropUpdater } = storeMethods;
	// we are going to create some helper methods to easily update parts of the store.
  const updateCart = createPropUpdater('cart');
	const store = {
		...storeMethods,
		updateCart,
	};

	// for debugging, make a global variable. Do not do this on prod.
	window.showStates = () => console.log(getStates());

	return (
		<Context.Provider value={store}>
			<StateTest parentProp='My name is react-global-states' />
		</Context.Provider>
	);
}

export default App;
