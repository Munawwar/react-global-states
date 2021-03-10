import React from 'react';
import { useGlobalState, connect } from './storeHelpers';
import * as cartActionCreators from './cart-actions';

const Component = ({
	parentProp = '',
	store: { updateStates, updateCart },
	cartActions,
}) => {
	console.log('StateTest render...');
	const { name } = useGlobalState('user');
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
			<button onClick={() => cartActions.incrementQuantity()}>Change another non-connected prop</button>
		</div>
	);
};

export default connect(Component, { cartActions: cartActionCreators });
