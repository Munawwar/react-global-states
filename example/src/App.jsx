import React from 'react';
import { setStates, getStates } from 'react-global-states';
import StateTest from './StateTest';

// initial state
setStates({
	cart: {
		count: 1,
		items: [{
			name: 'shoe',
			qty: 1
		}]
	},
	user: {
		name: 'dan',
	},
});

window.showStates = () => console.log(getStates());

function App() {
	return (
		<StateTest parentProp='My name is firoz' />
	);
}

export default App;
