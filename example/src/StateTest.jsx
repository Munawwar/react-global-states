import React from 'react';
import { useGlobalState, useStore } from './storeHelpers';
import * as cartActionCreators from './cart-actions';

const Component = ({
	parentProp = '',
	store,
	store: { updateStates, updateCart },
}) => {
	console.log('StateTest render...');
	const { name } = useGlobalState('user');
	const store = useStore();
	return (
		<div>
			Hi {name}
			<br />
			{parentProp}
			<br />
			<br />
			<button onClick={() => updateStates({ user: { name: 'everyone' } })}>Greet everyone instead</button>

			<br />
			<br />
			<button onClick={() => updateCart({ count: 0 })}>Change non-connected prop</button>
			<br />
			<button onClick={() => cartActionCreators.incrementQuantity(store)}>Change another non-connected prop</button>
		</div>
	);
};

export default Component;
